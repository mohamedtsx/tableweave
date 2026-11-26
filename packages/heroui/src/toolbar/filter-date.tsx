"use client";

import { Button } from "@heroui/react/button";
import type {
  DateRange,
  DateValue,
  OperatorRegistry,
  QueryFor,
  QuerySchema,
  StandaloneDate,
} from "@tableweave/react/contracts";
import { canonicalJson, parseQuery } from "@tableweave/react/contracts";
import { compileFilter, relativePresets } from "@tableweave/react/filters";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type {
  CriteriaDateBundle,
  CriteriaDateStateHandle,
} from "../date/criteria-date-state.js";
import {
  beginCriteriaDateEdit,
  closeCriteriaDateEdit,
  createCriteriaDateBundle,
  criteriaDateState,
  readCriteriaDateToolbar,
  reconcileCriteriaDateBundle,
  requireCriteriaDateSession,
  requireCriteriaDateState,
  selectCriteriaDatePreset,
  setCriteriaDateNotice,
} from "../date/criteria-date-state.js";
import { DateOperandEditor } from "../date/date-operand-editor.js";
import type {
  DateDraft,
  DateEditorMessages,
  DateFieldDefinition,
  FilterDateContext,
} from "../date/date-types.js";
import { dateEditorMessages } from "../date/date-types.js";
import { calendarSeed, dayWire } from "../date/date-wire.js";
import type {
  CriteriaActor,
  CriteriaCommitCell,
  CriteriaLocalCell,
  CriteriaWorkHandle,
} from "../filters/criteria-commit.js";
import type {
  CriteriaToolbarStore,
  ToolbarCommitted,
} from "./criteria-tool-host.js";
import {
  CriteriaToolbarNeutral,
  CriteriaToolHost,
  useCriteriaToolbarVersion,
} from "./criteria-tool-host.js";
import type { FilterToolMessages, FilterToolProps } from "./filter-shared.js";
import {
  filterToolMessages,
  observeMutation,
  useFilterOwner,
} from "./filter-shared.js";

export type { FilterDateContext } from "../date/date-types.js";
export interface FilterDateMessages
  extends FilterToolMessages,
    DateEditorMessages {
  readonly label: string;
  readonly applyLabel: string;
  readonly cancelLabel: string;
  readonly clearLabel: string;
  readonly emptySummary: string;
  readonly formatSummary: (
    date: StandaloneDate,
    context: FilterDateContext,
  ) => string;
  readonly formatTimeZone: (timeZone: string) => string;
}
export interface FilterDateProps<S extends QuerySchema>
  extends FilterToolProps<S> {
  readonly registry?: OperatorRegistry;
  /** Omitted: configured symbolic presets. Empty: no standalone preset buttons. */
  readonly presets?: readonly {
    readonly id: string;
    readonly label: string;
    readonly date: NonNullable<QueryFor<S>["date"]>;
  }[];
  readonly messages?: Partial<FilterDateMessages>;
}

const defaults: FilterDateMessages = {
  ...filterToolMessages,
  ...dateEditorMessages,
  label: "Filter by date",
  applyLabel: "Apply date filter",
  cancelLabel: "Cancel date edit",
  clearLabel: "Clear date filter",
  emptySummary: "Any date",
  formatTimeZone: (timeZone) => `Time zone: ${timeZone}`,
  formatSummary: (date, context) => {
    function point(value: DateValue): string {
      if (value.kind === "relative" || value.kind === "rolling")
        return dateEditorMessages.formatRelative(value);
      if (value.kind === "day") return value.value;
      return new Intl.DateTimeFormat(context.locale, {
        timeZone: context.timeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
        timeZoneName: "short",
      }).format(new Date(value.value));
    }
    return date.operator === "date.between"
      ? `${point(date.value[0])} – ${point(date.value[1])}`
      : point(date.value);
  },
};

interface DateSession {
  readonly owner: object;
  readonly base: string;
  readonly seed: StandaloneDate | null;
  readonly key: number;
}

export function FilterDate<S extends QuerySchema>(props: FilterDateProps<S>) {
  return (
    <CriteriaToolHost<"date", S, CriteriaDateLocal<S>, FilterDateProps<S>>
      kind="date"
      input={props}
      createLocal={createCriteriaDateLocal}
      Legacy={LegacyFilterDate}
      Surface={CriteriaDateSurface}
    />
  );
}
function LegacyFilterDate<S extends QuerySchema>(props: FilterDateProps<S>) {
  const messages = { ...defaults, ...props.messages };
  const { controller } = props;
  const { state, owner, active, isCurrent } = useFilterOwner(props);
  const schema = controller.getDefinition().schema;
  const entry = Object.entries(schema.fields).find(
    ([, field]) => field.owner === "date",
  );
  const field: DateFieldDefinition | null =
    entry && (entry[1].type === "date" || entry[1].type === "datetime")
      ? entry[1]
      : null;
  const mode = schema.date?.mode ?? "range";
  const context: FilterDateContext = {
    locale: state.query.locale,
    timeZone: state.query.timeZone,
    evaluatedAt: state.evaluatedAt,
  };
  const [session, setSession] = useState<DateSession | null>(null);
  const [candidate, setCandidate] = useState<StandaloneDate | null>(null);
  const draft = useRef<DateDraft<DateValue | DateRange>>({
    status: "empty",
    value: null,
  });
  const [notice, setNotice] = useState<{ owner: object; text: string } | null>(
    null,
  );
  const trigger = useRef<HTMLButtonElement | null>(null);
  const editor = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);
  const sequence = useRef(0);
  const editorId = useId();
  const base = canonicalJson(state.query.date);
  const open = session?.owner === owner && session.base === base && active;
  useLayoutEffect(() => {
    if (open && !wasOpen.current)
      editor.current
        ?.querySelector<HTMLElement>("select, input, [role=spinbutton]")
        ?.focus();
    else if (!open && wasOpen.current && active) trigger.current?.focus();
    wasOpen.current = open;
  }, [open, active]);
  const options = props.registry ? { registry: props.registry } : {};
  function validate(date: StandaloneDate | null) {
    const parsed = parseQuery(
      schema,
      { ...controller.getSnapshot().query, date },
      options,
    );
    if (!parsed.success) return parsed;
    try {
      compileFilter(schema, parsed.data, {
        ...options,
        now: state.evaluatedAt,
      });
      return parsed;
    } catch {
      return null;
    }
  }
  // Ask the actual normalizer, not a copied operatorAllowed implementation.
  const probePoint = field?.min ?? dayWire(calendarSeed(context));
  const probe = field
    ? parseQuery(
        schema,
        {
          ...state.query,
          date:
            mode === "single"
              ? { operator: "date.on", value: probePoint }
              : { operator: "date.between", value: [probePoint, probePoint] },
        },
        options,
      )
    : null;
  const incompatibleOperator =
    probe?.success === false &&
    probe.issues.some((issue) => issue.code === "rule.operator");
  const configured = field !== null && !incompatibleOperator;
  function close() {
    draft.current = { status: "empty", value: null };
    setCandidate(null);
    setSession(null);
    trigger.current?.focus();
  }
  function submit(date: StandaloneDate | null) {
    if (!isCurrent() || (date !== null && !configured)) return;
    const parsed = validate(date);
    if (!parsed?.success) {
      setNotice({ owner, text: messages.invalidValue });
      return;
    }
    try {
      const result = controller.dispatch({
        type: "date.commit",
        date: parsed.data.date,
      });
      if (result.status === "rejected")
        setNotice({ owner, text: messages.failed });
      else {
        close();
        setNotice({
          owner,
          text: result.status === "proposed" ? messages.submitted : "",
        });
      }
      observeMutation(props.onMutation, result);
    } catch {
      setNotice({ owner, text: messages.invalidValue });
    }
  }
  const builtins = field
    ? [
        ...(field.relativePresets ?? relativePresets).map((preset) => ({
          kind: "relative" as const,
          preset,
        })),
        ...(field.rollingDays ?? []).flatMap((days) => [
          { kind: "rolling" as const, days, direction: "past" as const },
          { kind: "rolling" as const, days, direction: "future" as const },
        ]),
      ].map((value) => ({
        id: canonicalJson(value),
        label: messages.formatRelative(value),
        date: { operator: "date.on" as const, value },
      }))
    : [];
  const presets = props.presets ?? builtins;
  const candidateValid =
    candidate !== null && validate(candidate)?.success === true;
  function receive(value: DateDraft<DateValue | DateRange>) {
    if (!isCurrent() || !open) return;
    draft.current = value;
    if (value.status === "complete") {
      const next: StandaloneDate = Array.isArray(value.value)
        ? { operator: "date.between", value: value.value as DateRange }
        : { operator: "date.on", value: value.value as DateValue };
      setCandidate(next);
    } else setCandidate(null);
  }
  return (
    <div className={`tw-filter-date ${props.className ?? ""}`}>
      <div className="tw-filter-date-actions">
        <Button
          ref={trigger}
          variant="secondary"
          isDisabled={!active || !configured}
          aria-expanded={open}
          aria-controls={editorId}
          onPress={() => {
            if (!isCurrent()) return;
            if (open) close();
            else {
              const seed = controller.getSnapshot().query.date;
              setCandidate(seed);
              draft.current = seed
                ? { status: "complete", value: seed.value }
                : { status: "empty", value: null };
              setSession({ owner, base, seed, key: ++sequence.current });
              setNotice(null);
            }
          }}
        >
          {messages.label}
        </Button>
        <output className="tw-filter-date-summary" aria-label={messages.label}>
          {active
            ? state.query.date
              ? props.messages?.formatSummary
                ? props.messages.formatSummary(state.query.date, context)
                : state.query.date.operator === "date.on" &&
                    (state.query.date.value.kind === "relative" ||
                      state.query.date.value.kind === "rolling")
                  ? messages.formatRelative(state.query.date.value)
                  : messages.formatSummary(state.query.date, context)
              : messages.emptySummary
            : ""}
        </output>
        <Button
          variant="tertiary"
          isDisabled={!active || state.query.date === null}
          onPress={() => submit(null)}
        >
          {messages.clearLabel}
        </Button>
      </div>
      {!configured ? <p role="alert">{messages.invalidConfiguration}</p> : null}
      {!active ? <p role="status">{messages.unavailable}</p> : null}
      {open && field ? (
        <div
          ref={editor}
          id={editorId}
          className="tw-filter-date-editor"
          onKeyDownCapture={(event) => {
            if (event.key === "Escape") {
              if (
                event.target instanceof Element &&
                event.target.closest(
                  '[data-slot="date-picker-popover"], [data-slot="date-range-picker-popover"]',
                )
              )
                return;
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
        >
          <p className="tw-date-hint">
            {messages.formatTimeZone(context.timeZone)}
          </p>
          <div className="tw-filter-date-actions">
            {presets.map((preset) => {
              const allowed = validate(preset.date)?.success === true;
              return (
                <div key={preset.id}>
                  <Button
                    variant="tertiary"
                    isDisabled={!allowed}
                    onPress={() => {
                      setCandidate(preset.date);
                      draft.current = {
                        status: "complete",
                        value: preset.date.value,
                      };
                    }}
                  >
                    {preset.label}
                  </Button>
                  {!allowed ? (
                    <small>{messages.invalidConfiguration}</small>
                  ) : null}
                </div>
              );
            })}
          </div>
          {mode === "single" ? (
            <DateOperandEditor
              cardinality="one"
              value={
                session.seed?.operator === "date.on" ? session.seed.value : null
              }
              resetKey={session.key}
              field={field}
              context={context}
              messages={messages}
              onDraftChange={receive}
            />
          ) : (
            <DateOperandEditor
              cardinality="range"
              value={
                session.seed?.operator === "date.between"
                  ? session.seed.value
                  : null
              }
              resetKey={session.key}
              field={field}
              context={context}
              messages={messages}
              onDraftChange={receive}
            />
          )}
          <div className="tw-filter-date-actions">
            <Button
              className="tw-confirm-action"
              isDisabled={!candidateValid}
              onPress={() => {
                if (
                  draft.current.status === "complete" &&
                  candidate &&
                  session.base ===
                    canonicalJson(controller.getSnapshot().query.date)
                )
                  submit(candidate);
              }}
            >
              {messages.applyLabel}
            </Button>
            <Button variant="tertiary" onPress={close}>
              {messages.cancelLabel}
            </Button>
          </div>
        </div>
      ) : null}
      <span className="tw-filter-status" role="status">
        {notice?.owner === owner && active ? notice.text : ""}
      </span>
    </div>
  );
}

interface DateFocus<S extends QuerySchema> {
  readonly token: object;
  readonly intent: "editor" | "trigger";
  readonly baseline: string;
  readonly ownerKey: string;
  readonly owner: CriteriaActor<"date", S>;
  readonly editorHandle: CriteriaDateStateHandle | null;
  readonly expectedDate?: string;
  readonly actor: CriteriaActor<"date", S> | null;
  readonly work: CriteriaWorkHandle<"date", S> | null;
}
export interface CriteriaDateLocal<S extends QuerySchema> {
  readonly bundle: CriteriaDateBundle<"date", S>;
  readonly focus: CriteriaLocalCell<"date", S, DateFocus<S>>;
}
export function createCriteriaDateLocal<S extends QuerySchema>(
  cell: CriteriaCommitCell<"date", S>,
): CriteriaDateLocal<S> {
  return Object.freeze({
    bundle: createCriteriaDateBundle(cell, defaults),
    focus: cell.createLocal<DateFocus<S>>("session"),
  });
}
type DateStore<S extends QuerySchema> = CriteriaToolbarStore<
  "date",
  S,
  CriteriaDateLocal<S>
>;
type DateFrame<S extends QuerySchema> = ToolbarCommitted<
  "date",
  S,
  CriteriaDateLocal<S>
>;
function dateLive<S extends QuerySchema>(frame: DateFrame<S>) {
  frame.cell.require(frame.actor);
  const controller = frame.origin.controller,
    definition = controller.getDefinition(),
    state = controller.getSnapshot();
  frame.cell.require(frame.actor);
  if (definition !== frame.origin.definition)
    throw new Error("Criteria date unavailable.");
  const entry = Object.entries(definition.schema.fields).find(
    ([, field]) => field.owner === "date",
  );
  const field: DateFieldDefinition | null =
    entry && (entry[1].type === "date" || entry[1].type === "datetime")
      ? entry[1]
      : null;
  const context: FilterDateContext = {
    locale: state.query.locale,
    timeZone: state.query.timeZone,
    evaluatedAt: state.evaluatedAt,
  };
  const mode = definition.schema.date?.mode ?? "range";
  const baseline = canonicalJson([
    state.query.date,
    entry ?? null,
    mode,
    context.locale,
    context.timeZone,
  ]);
  const ownerKey = canonicalJson([
    entry ?? null,
    mode,
    context.locale,
    context.timeZone,
  ]);
  return {
    schema: definition.schema,
    state,
    field,
    context,
    mode,
    baseline,
    ownerKey,
  };
}
function dateGuard<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
  baseline?: string,
  evaluatedAt?: number,
) {
  const frame = store.require(actor),
    live = dateLive(frame);
  if (baseline !== undefined && live.baseline !== baseline)
    throw new Error("Criteria date unavailable.");
  if (evaluatedAt !== undefined && live.context.evaluatedAt !== evaluatedAt)
    throw new Error("Criteria date unavailable.");
  return { frame, live };
}
function dateMessages<S extends QuerySchema>(
  frame: DateFrame<S>,
): FilterDateMessages {
  frame.cell.require(frame.actor);
  const result = Object.freeze({ ...defaults, ...frame.ports.messages });
  frame.cell.require(frame.actor);
  return result;
}
function validateCriteriaDate<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
  date: StandaloneDate | null,
  baseline: string,
  expected?: {
    readonly handle: CriteriaDateStateHandle;
    readonly candidate?: string;
  },
) {
  const { frame, live } = dateGuard(store, actor, baseline),
    options = frame.ports.registry ? { registry: frame.ports.registry } : {};
  const check = () => {
    dateGuard(store, actor, baseline, live.context.evaluatedAt);
    if (expected) {
      requireCriteriaDateState(expected.handle);
      const current = readCriteriaDateToolbar(frame.local.bundle, actor);
      if (
        !current.open ||
        current.handle !== expected.handle ||
        (expected.candidate !== undefined &&
          (current.draft.status !== "complete" ||
            canonicalJson(current.candidate) !== expected.candidate))
      )
        throw new Error("Criteria date unavailable.");
    }
  };
  check();
  const parsed = parseQuery(
    live.schema,
    { ...live.state.query, date },
    options,
  );
  check();
  if (!parsed.success) return null;
  try {
    compileFilter(live.schema, parsed.data, {
      ...options,
      now: live.context.evaluatedAt,
    });
    check();
    return { date: parsed.data.date };
  } catch {
    check();
    return null;
  }
}
function configuredCriteriaDate<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
  baseline: string,
): boolean {
  const { frame, live } = dateGuard(store, actor, baseline);
  if (!live.field) return false;
  const probePoint = live.field.min ?? dayWire(calendarSeed(live.context));
  const parsed = parseQuery(
    live.schema,
    {
      ...live.state.query,
      date:
        live.mode === "single"
          ? { operator: "date.on", value: probePoint }
          : { operator: "date.between", value: [probePoint, probePoint] },
    },
    frame.ports.registry ? { registry: frame.ports.registry } : {},
  );
  dateGuard(store, actor, baseline, live.context.evaluatedAt);
  return !(
    parsed.success === false &&
    parsed.issues.some((issue) => issue.code === "rule.operator")
  );
}
function reconcileDate<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
) {
  const { frame } = dateGuard(store, actor);
  reconcileCriteriaDateBundle(frame.local.bundle, actor);
  if (frame.disabled) closeCriteriaDateEdit(frame.local.bundle, actor);
  const live = dateGuard(store, actor).live;
  const plan = frame.local.focus.read(actor);
  if (!plan) return;
  const current = readCriteriaDateToolbar(frame.local.bundle, actor);
  const acceptedOwn =
    plan.intent === "trigger" &&
    plan.expectedDate !== undefined &&
    plan.expectedDate === canonicalJson(live.state.query.date) &&
    plan.ownerKey === live.ownerKey;
  const invalid =
    frame.disabled ||
    plan.ownerKey !== live.ownerKey ||
    (plan.baseline !== live.baseline && !acceptedOwn) ||
    (plan.intent === "editor" &&
      (!current.open ||
        (plan.owner === actor && plan.editorHandle !== current.handle)));
  if (invalid) {
    if (plan.work) frame.cell.cancelWork(actor, plan.work);
    frame.local.focus.clear(actor);
    return;
  }
  if (plan.owner !== actor || plan.baseline !== live.baseline) {
    if (plan.work) frame.cell.cancelWork(actor, plan.work);
    frame.local.focus.write(actor, {
      ...plan,
      owner: actor,
      baseline: live.baseline,
      editorHandle: plan.intent === "editor" ? current.handle : null,
      actor: null,
      work: null,
    });
  }
}
function closeDate<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
  expectedDate?: string,
) {
  try {
    const { frame, live } = dateGuard(store, actor);
    if (frame.disabled) return;
    closeCriteriaDateEdit(frame.local.bundle, actor);
    const prior = frame.local.focus.read(actor);
    if (prior?.work) frame.cell.cancelWork(actor, prior.work);
    frame.local.focus.write(actor, {
      token: Object.freeze({}),
      intent: "trigger",
      baseline: live.baseline,
      ownerKey: live.ownerKey,
      owner: actor,
      editorHandle: null,
      ...(expectedDate === undefined ? {} : { expectedDate }),
      actor: null,
      work: null,
    });
  } catch {
    /* No stale focus or private fallback. */
  }
}
function openDate<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
) {
  try {
    const { frame, live } = dateGuard(store, actor);
    if (frame.disabled || !configuredCriteriaDate(store, actor, live.baseline))
      return;
    reconcileDate(store, actor);
    if (readCriteriaDateToolbar(frame.local.bundle, actor).open) {
      closeDate(store, actor);
      return;
    }
    dateGuard(store, actor, live.baseline);
    const editorHandle = beginCriteriaDateEdit(frame.local.bundle, actor);
    const prior = frame.local.focus.read(actor);
    if (prior?.work) frame.cell.cancelWork(actor, prior.work);
    frame.local.focus.write(actor, {
      token: Object.freeze({}),
      intent: "editor",
      baseline: live.baseline,
      ownerKey: live.ownerKey,
      owner: actor,
      editorHandle,
      actor: null,
      work: null,
    });
  } catch {
    try {
      const { frame } = dateGuard(store, actor);
      setCriteriaDateNotice(
        frame.local.bundle,
        actor,
        dateMessages(frame).invalidValue,
      );
    } catch {
      /* Denied. */
    }
  }
}
function submitDate<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
  clear: boolean,
) {
  let baseline: string | undefined;
  let expected:
    | { readonly handle: CriteriaDateStateHandle; readonly candidate: string }
    | undefined;
  try {
    const { frame, live } = dateGuard(store, actor);
    if (frame.disabled) return;
    baseline = live.baseline;
    reconcileDate(store, actor);
    const local = readCriteriaDateToolbar(frame.local.bundle, actor);
    if (
      !clear &&
      (!local.open ||
        !local.handle ||
        local.draft.status !== "complete" ||
        !local.candidate)
    )
      return;
    if (!clear && !configuredCriteriaDate(store, actor, baseline)) return;
    const candidate = clear ? null : local.candidate;
    expected =
      !clear && local.handle
        ? { handle: local.handle, candidate: canonicalJson(candidate) }
        : undefined;
    const parsed = validateCriteriaDate(
      store,
      actor,
      candidate,
      baseline,
      expected,
    );
    if (parsed === null) {
      setCriteriaDateNotice(
        frame.local.bundle,
        actor,
        dateMessages(frame).invalidValue,
      );
      return;
    }
    dateGuard(store, actor, baseline, live.context.evaluatedAt);
    if (expected) {
      requireCriteriaDateState(expected.handle);
      const current = readCriteriaDateToolbar(frame.local.bundle, actor);
      if (
        current.handle !== expected.handle ||
        current.draft.status !== "complete" ||
        canonicalJson(current.candidate) !== expected.candidate
      )
        return;
    }
    const result = frame.origin.controller.dispatch({
      type: "date.commit",
      date: parsed.date,
    });
    const after = dateGuard(store, actor),
      messages = dateMessages(after.frame);
    let sameEdit =
      after.live.ownerKey === live.ownerKey &&
      (after.live.baseline === live.baseline ||
        canonicalJson(after.live.state.query.date) ===
          canonicalJson(parsed.date));
    try {
      if (local.handle) requireCriteriaDateSession(local.handle);
      else if (
        readCriteriaDateToolbar(after.frame.local.bundle, actor).handle !== null
      )
        sameEdit = false;
    } catch {
      sameEdit = false;
    }
    if (sameEdit) {
      if (result.status === "rejected")
        setCriteriaDateNotice(frame.local.bundle, actor, messages.failed);
      else {
        closeDate(store, actor, canonicalJson(parsed.date));
        setCriteriaDateNotice(
          frame.local.bundle,
          actor,
          result.status === "proposed" ? messages.submitted : "",
        );
      }
    }
    // A same-actor reentrant edit must not swallow the application's actual
    // proposal receipt even though it prevents all old-edit cleanup/notice.
    dateGuard(store, actor);
    observeMutation(frame.ports.onMutation, result);
    dateGuard(store, actor);
    reconcileDate(store, actor);
  } catch {
    try {
      const { frame } = dateGuard(store, actor, baseline);
      if (expected) {
        requireCriteriaDateState(expected.handle);
        if (
          canonicalJson(
            readCriteriaDateToolbar(frame.local.bundle, actor).candidate,
          ) !== expected.candidate
        )
          return;
      }
      setCriteriaDateNotice(
        frame.local.bundle,
        actor,
        dateMessages(frame).invalidValue,
      );
    } catch {
      /* A never uses B after callback reentry. */
    }
  }
}
function datePresets<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
  baseline: string,
) {
  const { frame, live } = dateGuard(store, actor, baseline),
    messages = dateMessages(frame);
  const scope = readCriteriaDateToolbar(frame.local.bundle, actor).handle;
  if (frame.ports.presets !== undefined) return frame.ports.presets;
  if (!live.field) return [];
  return [
    ...(live.field.relativePresets ?? relativePresets).map((preset) => ({
      kind: "relative" as const,
      preset,
    })),
    ...(live.field.rollingDays ?? []).flatMap((days) => [
      { kind: "rolling" as const, days, direction: "past" as const },
      { kind: "rolling" as const, days, direction: "future" as const },
    ]),
  ].map((value) => {
    dateGuard(store, actor, baseline, live.context.evaluatedAt);
    if (scope) requireCriteriaDateState(scope);
    const label = messages.formatRelative(value);
    dateGuard(store, actor, baseline, live.context.evaluatedAt);
    if (scope) requireCriteriaDateState(scope);
    if (typeof label !== "string")
      throw new Error("Criteria date unavailable.");
    return {
      id: canonicalJson(value),
      label,
      date: { operator: "date.on" as const, value },
    };
  });
}
function presetDate<S extends QuerySchema>(
  store: DateStore<S>,
  actor: CriteriaActor<"date", S>,
  id: string,
) {
  try {
    const { frame, live } = dateGuard(store, actor);
    if (frame.disabled) return;
    reconcileDate(store, actor);
    if (!readCriteriaDateToolbar(frame.local.bundle, actor).open) return;
    const preset = datePresets(store, actor, live.baseline).find(
      (item) => item.id === id,
    );
    if (!preset) return;
    const scope = readCriteriaDateToolbar(frame.local.bundle, actor).handle;
    const parsed = validateCriteriaDate(
      store,
      actor,
      preset.date,
      live.baseline,
      scope ? { handle: scope } : undefined,
    );
    dateGuard(store, actor, live.baseline);
    if (parsed === null) return;
    const focus = frame.local.focus.read(actor);
    if (focus?.work) frame.cell.cancelWork(actor, focus.work);
    frame.local.focus.clear(actor);
    selectCriteriaDatePreset(frame.local.bundle, actor, preset.date);
  } catch {
    /* Denied. */
  }
}
export const criteriaDate = Object.freeze({
  open: openDate,
  cancel: closeDate,
  apply: <S extends QuerySchema>(
    store: DateStore<S>,
    actor: CriteriaActor<"date", S>,
  ) => submitDate(store, actor, false),
  clear: <S extends QuerySchema>(
    store: DateStore<S>,
    actor: CriteriaActor<"date", S>,
  ) => submitDate(store, actor, true),
  preset: presetDate,
  reconcile: reconcileDate,
});

function CriteriaDateSurface<S extends QuerySchema>({
  store,
}: {
  readonly store: DateStore<S>;
}) {
  const version = useCriteriaToolbarVersion(store),
    frame = store.read(),
    actor = frame?.actor;
  const trigger = useRef<HTMLButtonElement | null>(null),
    editor = useRef<HTMLDivElement | null>(null),
    editorId = useId();
  useLayoutEffect(() => {
    if (!actor || store.getSnapshot() !== version) return;
    try {
      reconcileDate(store, actor);
      const current = store.require(actor),
        plan = current.local.focus.read(actor);
      if (!plan) return;
      if (plan.actor === actor && plan.work) return;
      if (plan.work) current.cell.cancelWork(actor, plan.work);
      const work = current.cell.animationFrame(actor, () => {
        try {
          const checked = dateGuard(store, actor, plan.baseline);
          if (checked.frame.disabled) return undefined;
          const activePlan = checked.frame.local.focus.read(actor);
          if (activePlan?.token !== plan.token) return undefined;
          const local = readCriteriaDateToolbar(
            checked.frame.local.bundle,
            actor,
          );
          if (plan.intent === "editor" && !local.open) return undefined;
          if (plan.intent === "editor") {
            if (!plan.editorHandle || local.handle !== plan.editorHandle)
              return undefined;
            requireCriteriaDateState(plan.editorHandle);
          }
          const target =
            plan.intent === "editor"
              ? editor.current?.querySelector<HTMLElement>(
                  "select, input, [role=spinbutton]",
                )
              : trigger.current;
          dateGuard(store, actor, plan.baseline);
          if (checked.frame.local.focus.read(actor) !== activePlan)
            return undefined;
          target?.focus();
          dateGuard(store, actor, plan.baseline);
          if (plan.intent === "editor" && plan.editorHandle)
            requireCriteriaDateState(plan.editorHandle);
          if (checked.frame.local.focus.read(actor) === activePlan)
            checked.frame.local.focus.clear(actor);
        } catch {
          /* Real actor/baseline fences survive focus reentry. */
        }
        return undefined;
      });
      current.local.focus.write(actor, { ...plan, actor, work });
    } catch {
      /* Revoked actual actor/edit. */
    }
  }, [store, actor, version]);
  if (!frame || !actor) return <CriteriaToolbarNeutral kind="date" />;
  try {
    const live = dateLive(frame),
      messages = dateMessages(frame),
      active = !frame.disabled,
      configured = configuredCriteriaDate(store, actor, live.baseline),
      local = readCriteriaDateToolbar(frame.local.bundle, actor),
      open = local.open && active;
    let summary = "";
    if (active) {
      if (!live.state.query.date) summary = messages.emptySummary;
      else {
        dateGuard(store, actor, live.baseline, live.context.evaluatedAt);
        summary = frame.ports.messages?.formatSummary
          ? frame.ports.messages.formatSummary(
              live.state.query.date,
              live.context,
            )
          : live.state.query.date.operator === "date.on" &&
              (live.state.query.date.value.kind === "relative" ||
                live.state.query.date.value.kind === "rolling")
            ? messages.formatRelative(live.state.query.date.value)
            : messages.formatSummary(live.state.query.date, live.context);
        dateGuard(store, actor, live.baseline, live.context.evaluatedAt);
        if (typeof summary !== "string")
          throw new Error("Criteria date unavailable.");
      }
    }
    const candidateValid =
      local.candidate !== null &&
      validateCriteriaDate(
        store,
        actor,
        local.candidate,
        live.baseline,
        local.handle
          ? { handle: local.handle, candidate: canonicalJson(local.candidate) }
          : undefined,
      ) !== null;
    const presets = open ? datePresets(store, actor, live.baseline) : [];
    let zone = "";
    if (open) {
      dateGuard(store, actor, live.baseline);
      zone = messages.formatTimeZone(live.context.timeZone);
      dateGuard(store, actor, live.baseline, live.context.evaluatedAt);
      if (local.handle) requireCriteriaDateState(local.handle);
      if (typeof zone !== "string")
        throw new Error("Criteria date unavailable.");
    }
    const editHandle = local.handle;
    const output = (
      <div className={`tw-filter-date ${frame.className}`}>
        <div className="tw-filter-date-actions">
          <Button
            ref={trigger}
            variant="secondary"
            isDisabled={!active || !configured}
            aria-expanded={open}
            aria-controls={editorId}
            onPress={() => openDate(store, actor)}
          >
            {messages.label}
          </Button>
          <output
            className="tw-filter-date-summary"
            aria-label={messages.label}
          >
            {summary}
          </output>
          <Button
            variant="tertiary"
            isDisabled={!active || live.state.query.date === null}
            onPress={() => submitDate(store, actor, true)}
          >
            {messages.clearLabel}
          </Button>
        </div>
        {!configured ? (
          <p role="alert">{messages.invalidConfiguration}</p>
        ) : null}
        {!active ? <p role="status">{messages.unavailable}</p> : null}
        {open && live.field && editHandle ? (
          <div
            ref={editor}
            id={editorId}
            className="tw-filter-date-editor"
            onKeyDownCapture={(event) => {
              try {
                dateGuard(store, actor);
                requireCriteriaDateState(editHandle);
                if (event.key === "Escape") {
                  if (
                    event.target instanceof Element &&
                    event.target.closest(
                      '[data-slot="date-picker-popover"], [data-slot="date-range-picker-popover"]',
                    )
                  )
                    return;
                  dateGuard(store, actor);
                  requireCriteriaDateState(editHandle);
                  event.preventDefault();
                  event.stopPropagation();
                  closeDate(store, actor);
                }
              } catch {
                /* Denied before event/DOM reads. */
              }
            }}
          >
            <p className="tw-date-hint">{zone}</p>
            <div className="tw-filter-date-actions">
              {presets.map((preset) => {
                const allowed =
                    validateCriteriaDate(
                      store,
                      actor,
                      preset.date,
                      live.baseline,
                      editHandle ? { handle: editHandle } : undefined,
                    ) !== null,
                  presetId = preset.id;
                return (
                  <div key={presetId}>
                    <Button
                      variant="tertiary"
                      isDisabled={!allowed}
                      onPress={() => {
                        try {
                          dateGuard(store, actor);
                          requireCriteriaDateState(editHandle);
                          presetDate(store, actor, presetId);
                        } catch {
                          /* Saved old edit cannot act on a new session. */
                        }
                      }}
                    >
                      {preset.label}
                    </Button>
                    {!allowed ? (
                      <small>{messages.invalidConfiguration}</small>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {live.mode === "single" ? (
              <DateOperandEditor
                criteriaState={editHandle}
                cardinality="one"
                value={null}
                resetKey={0}
                field={live.field}
                context={live.context}
                messages={messages}
                onDraftChange={(draft) =>
                  criteriaDateState.operand(editHandle, draft)
                }
              />
            ) : (
              <DateOperandEditor
                criteriaState={editHandle}
                cardinality="range"
                value={null}
                resetKey={0}
                field={live.field}
                context={live.context}
                messages={messages}
                onDraftChange={(draft) =>
                  criteriaDateState.operand(editHandle, draft)
                }
              />
            )}
            <div className="tw-filter-date-actions">
              <Button
                className="tw-confirm-action"
                isDisabled={!candidateValid}
                onPress={() => {
                  try {
                    dateGuard(store, actor);
                    requireCriteriaDateState(editHandle);
                    submitDate(store, actor, false);
                  } catch {
                    /* Saved old edit cannot apply a new session. */
                  }
                }}
              >
                {messages.applyLabel}
              </Button>
              <Button
                variant="tertiary"
                onPress={() => {
                  try {
                    dateGuard(store, actor);
                    requireCriteriaDateState(editHandle);
                    closeDate(store, actor);
                  } catch {
                    /* Saved old edit cannot close a new session. */
                  }
                }}
              >
                {messages.cancelLabel}
              </Button>
            </div>
          </div>
        ) : null}
        <span className="tw-filter-status" role="status">
          {active ? local.notice : ""}
        </span>
      </div>
    );
    dateGuard(store, actor, live.baseline, live.context.evaluatedAt);
    if (open && editHandle) requireCriteriaDateState(editHandle);
    return output;
  } catch {
    return <CriteriaToolbarNeutral kind="date" />;
  }
}
