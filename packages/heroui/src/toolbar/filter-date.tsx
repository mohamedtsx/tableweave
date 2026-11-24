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
import { DateOperandEditor } from "../date/date-operand-editor.js";
import type {
  DateDraft,
  DateEditorMessages,
  DateFieldDefinition,
  FilterDateContext,
} from "../date/date-types.js";
import { dateEditorMessages } from "../date/date-types.js";
import { calendarSeed, dayWire } from "../date/date-wire.js";
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
