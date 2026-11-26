"use client";

import { Button } from "@heroui/react/button";
import { Input } from "@heroui/react/input";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Popover } from "@heroui/react/popover";
import { TextField } from "@heroui/react/textfield";
import type { TableCommand, TableState } from "@tableweave/react";
import { useTableweaveState } from "@tableweave/react";
import type { QuerySchema, RuleFor } from "@tableweave/react/contracts";
import type {
  BuilderFieldId,
  OperatorDescriptor,
} from "@tableweave/react/filters";
import {
  defaultOperatorRegistry,
  getBuilderFields,
  getFieldOperators,
  invertRule,
  validateRuleDraft,
} from "@tableweave/react/filters";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { dateEditorMessages } from "../date/date-operand-editor.js";
import { dateOperandValue } from "./date-value.js";
import { builderMessages, operatorLabel } from "./messages.js";
import {
  OptionOwners,
  scalarIds,
  useBuilderOptionViews,
} from "./option-owners.js";
import type { FilterBuilderMessages, FilterBuilderProps } from "./types.js";
import { requestOptions, ValueEditor } from "./value-editors.js";
import type {
  CriteriaBuilderStore,
  CriteriaBuilderEditorHandle,
  BuilderDraft,
} from "./criteria-builder-host.js";
import {
  CriteriaBuilderHost,
  useCriteriaBuilderVersion,
  builderState,
  builderEditor,
  readBuilderEditor,
  requireBuilderEditor,
  builderRegistry,
  validateBuilder,
  builderActions,
  editorActions,
  reconcileBuilder,
  safely,
} from "./criteria-builder-host.js";
import { CriteriaOptionOwners, criteriaOptionView } from "./option-owners.js";

interface Draft {
  readonly id: string;
  readonly field: string;
  readonly operator: string;
  readonly value: unknown;
  readonly baseline: string | null;
  readonly anchor: string;
  readonly part: "field" | "operator" | "value" | "options";
  readonly owner: object;
  readonly definition: string;
  readonly resourceDefinition: string;
  readonly scope: string;
  readonly epoch: string | number;
}

function FieldPicker<S extends QuerySchema>({
  props,
  messages,
  onChoose,
}: {
  readonly props: FilterBuilderProps<S>;
  readonly messages: FilterBuilderMessages;
  readonly onChoose: (id: BuilderFieldId<S>) => void;
}) {
  const [search, setSearch] = useState("");
  const fields = getBuilderFields(
    props.controller.getDefinition().schema,
  ).filter((field) =>
    (props.fields[field.id]?.label ?? field.id)
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  return (
    <>
      <TextField value={search} onChange={setSearch}>
        <Label>{messages.searchFields}</Label>
        <Input autoFocus />
      </TextField>
      {!fields.length && <p>{messages.noFields}</p>}
      <ListBox
        aria-label={messages.chooseField}
        escapeKeyBehavior="none"
        onAction={(key) => {
          const entry = fields.find((field) => field.id === key);
          if (entry) onChoose(entry.id);
        }}
      >
        {fields.map((entry) => (
          <ListBox.Item
            key={entry.id}
            id={entry.id}
            textValue={props.fields[entry.id]?.label ?? entry.id}
          >
            {props.fields[entry.id]?.label ?? entry.id}
          </ListBox.Item>
        ))}
      </ListBox>
    </>
  );
}

function BuilderSurface<S extends QuerySchema>({
  props,
  state,
}: {
  readonly props: FilterBuilderProps<S>;
  readonly state: TableState<S>;
}) {
  const schema = props.controller.getDefinition().schema;
  const registry = props.registry ?? defaultOperatorRegistry;
  const messages = { ...builderMessages, ...props.messages };
  const fields = getBuilderFields(schema);
  const usableOperator = (operator: OperatorDescriptor) =>
    props.evaluationMode === "server" ||
    operator.builtin ||
    typeof operator.custom?.evaluate === "function";
  const views = useBuilderOptionViews();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const allocated = useRef(new Set<string>());
  const focus = useCallback((anchor: string) => {
    requestAnimationFrame(() =>
      (
        triggers.current.get(anchor) ?? triggers.current.get("filters")
      )?.focus(),
    );
  }, []);
  const acceptedRule = draft
    ? state.query.builder.rules.find((rule) => rule.id === draft.id)
    : undefined;
  function matchesDraft(candidate: Draft, snapshot: TableState<S>) {
    const baseline = snapshot.query.builder.rules.find(
      (rule) => rule.id === candidate.id,
    );
    const field = fields.find((entry) => entry.id === candidate.field);
    const optionContext = field
      ? props.fields[field.id]?.asyncOptions?.source.getSnapshot().context
      : undefined;
    return (
      candidate.owner === props.controller &&
      candidate.definition === snapshot.definitionIdentity &&
      candidate.resourceDefinition ===
        props.expectedResourceContext.definitionKey &&
      candidate.scope === props.expectedResourceContext.scopeKey &&
      candidate.epoch === props.invalidationKey &&
      props.expectedResourceContext.access &&
      (!optionContext ||
        (optionContext.access &&
          optionContext.definitionKey === candidate.resourceDefinition &&
          optionContext.scopeKey === candidate.scope &&
          optionContext.fieldId === candidate.field)) &&
      (candidate.baseline === null
        ? baseline === undefined
        : baseline !== undefined &&
          JSON.stringify(baseline) === candidate.baseline)
    );
  }
  const currentDraft = draft && matchesDraft(draft, state) ? draft : null;
  useEffect(() => {
    if (draft && !currentDraft) {
      setDraft(null);
      focus(draft.anchor);
    }
  }, [draft, currentDraft, focus]);
  function close(anchor = currentDraft?.anchor ?? "filters") {
    setDraft(null);
    setError("");
    focus(anchor);
  }
  function stale(candidate?: Draft) {
    setDraft(null);
    setError(messages.staleDraft);
    focus(candidate?.anchor ?? "filters");
  }
  function liveDraft(candidate: Draft) {
    const latest = props.controller.getSnapshot();
    if (!matchesDraft(candidate, latest)) {
      stale(candidate);
      return null;
    }
    return latest;
  }
  function nextId(): string | null {
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const id = props.createRuleId
          ? props.createRuleId()
          : `tw-${crypto.randomUUID()}`;
        if (
          typeof id === "string" &&
          id &&
          !allocated.current.has(id) &&
          !props.controller
            .getSnapshot()
            .query.builder.rules.some((rule) => rule.id === id)
        ) {
          allocated.current.add(id);
          return id;
        }
      }
    } catch {
      /* ID factories cannot bypass safe local failure reporting. */
    }
    setError(messages.mutationFailed);
    return null;
  }
  function dispatch(
    command: TableCommand<S>,
    committedMessage = messages.applied,
    basis = currentDraft ?? undefined,
  ) {
    // Connected DOM handlers can run before React commits an external update.
    // Compare semantic ownership/baselines, not revision (paging is unrelated).
    const latest = props.controller.getSnapshot();
    if (
      basis
        ? !matchesDraft(basis, latest)
        : !props.expectedResourceContext.access ||
          latest.definitionIdentity !== state.definitionIdentity ||
          JSON.stringify(latest.query.builder) !==
            JSON.stringify(state.query.builder)
    ) {
      stale(basis);
      return null;
    }
    if (command.type === "builder.commit") {
      const descriptor = registry.get(command.rule.operator);
      if (!descriptor || !usableOperator(descriptor)) {
        setError(messages.invalid);
        return null;
      }
    }
    try {
      const result = props.controller.dispatch(command);
      try {
        props.onMutation?.(result, command);
      } catch {
        setError(messages.mutationFailed);
      }
      if (result.status === "rejected") {
        setError(messages.mutationFailed);
        return null;
      }
      setAnnouncement(
        result.status === "proposed" ? messages.submitted : committedMessage,
      );
      return result;
    } catch {
      setError(messages.mutationFailed);
      return null;
    }
  }
  function open(anchor: string, part: Draft["part"], rule?: RuleFor<S>) {
    if (!props.expectedResourceContext.access) return;
    const latest = props.controller.getSnapshot();
    if (
      latest.definitionIdentity !== state.definitionIdentity ||
      (rule &&
        JSON.stringify(
          latest.query.builder.rules.find((entry) => entry.id === rule.id),
        ) !== JSON.stringify(rule))
    ) {
      stale();
      focus(anchor);
      return;
    }
    const id = rule?.id ?? nextId();
    if (!id) return;
    setError("");
    setDraft({
      id,
      field: rule?.field ?? "",
      operator: rule?.operator ?? "",
      value: rule?.value,
      baseline: rule ? JSON.stringify(rule) : null,
      anchor,
      part,
      owner: props.controller,
      definition: latest.definitionIdentity,
      resourceDefinition: props.expectedResourceContext.definitionKey,
      scope: props.expectedResourceContext.scopeKey,
      epoch: props.invalidationKey,
    });
    if (part === "value" && rule) {
      const field = fields.find((entry) => entry.id === rule.field);
      const port = field ? props.fields[field.id]?.asyncOptions : undefined;
      if (port && views.get(rule.field)?.display === "idle")
        requestOptions(
          port,
          props.expectedResourceContext,
          rule.field,
          "",
          "first",
        );
    }
  }
  function validation(candidate: Draft, snapshot = state) {
    return validateRuleDraft(
      props.controller.getDefinition().schema,
      snapshot.query,
      {
        id: candidate.id,
        field: candidate.field,
        operator: candidate.operator,
        ...(candidate.value === undefined ? {} : { value: candidate.value }),
      },
      {
        now: snapshot.evaluatedAt,
        registry,
        ...(candidate.baseline === null ? {} : { replaceRuleId: candidate.id }),
      },
    );
  }
  function submit(candidate: Draft, immediate = false) {
    const latest = liveDraft(candidate);
    if (!latest) return;
    const checked = validation(candidate, latest);
    if (checked.status !== "valid") {
      setError(
        checked.status === "incomplete"
          ? messages.incomplete
          : messages.invalid,
      );
      return;
    }
    setError("");
    const result = dispatch(
      { type: "builder.commit", rule: checked.rule },
      messages.applied,
      candidate,
    );
    if (!result) return;
    if (immediate) {
      if (result.status === "committed") {
        const committed = result.transition.state.query.builder.rules.find(
          (rule) => rule.id === candidate.id,
        );
        if (committed)
          setDraft({
            ...candidate,
            value: committed.value,
            baseline: JSON.stringify(committed),
            part: "value",
          });
      }
      // A proposed immediate choice stays accepted-controlled, not optimistic.
    } else
      close(candidate.baseline === null ? "filters" : `${candidate.id}:value`);
  }
  function chooseField(id: BuilderFieldId<S>) {
    if (!currentDraft || !liveDraft(currentDraft)) return;
    const operator = getFieldOperators(schema, id, registry)[0];
    const candidate = {
      ...currentDraft,
      field: id,
      operator: operator?.id ?? "",
      part: "operator" as const,
    };
    const retained =
      validation(candidate).status === "valid" &&
      operator?.cardinality !== "none";
    setDraft({ ...candidate, value: retained ? candidate.value : undefined });
    setError("");
  }
  function chooseOperator(id: string) {
    if (!currentDraft || !liveDraft(currentDraft)) return;
    const entry = fields.find((field) => field.id === currentDraft.field);
    if (!entry) return;
    const descriptor = getFieldOperators(schema, entry.id, registry).find(
      (operator) => operator.id === id,
    );
    if (!descriptor) return;
    let candidate = {
      ...currentDraft,
      operator: id,
      part: "value" as const,
      value: descriptor.cardinality === "none" ? undefined : currentDraft.value,
    };
    if (
      descriptor.cardinality !== "none" &&
      validation(candidate).status !== "valid"
    )
      candidate = { ...candidate, value: undefined };
    setDraft(candidate);
    setError("");
    if (descriptor.cardinality === "none") submit(candidate);
    else {
      const port = props.fields[entry.id]?.asyncOptions;
      if (port && views.get(entry.id)?.display === "idle")
        requestOptions(
          port,
          props.expectedResourceContext,
          entry.id,
          "",
          "first",
        );
    }
  }
  function remove(rule: RuleFor<S>) {
    const latest = currentDraft ? liveDraft(currentDraft) : null;
    if (!latest) return;
    const index = latest.query.builder.rules.findIndex(
      (item) => item.id === rule.id,
    );
    const neighbor =
      latest.query.builder.rules[index + 1] ??
      latest.query.builder.rules[index - 1];
    if (dispatch({ type: "builder.remove", ruleId: rule.id }, messages.removed))
      close(neighbor ? `${neighbor.id}:field` : "filters");
  }
  function negate(rule: RuleFor<S>) {
    const latest = currentDraft ? liveDraft(currentDraft) : null;
    if (!latest) return;
    const entry = fields.find((field) => field.id === rule.field);
    const descriptor = registry.get(rule.operator);
    const inverse = entry
      ? getFieldOperators(schema, entry.id, registry).find(
          (operator) =>
            operator.id === descriptor?.inverse && usableOperator(operator),
        )
      : undefined;
    if (!inverse) return;
    try {
      const inverted = invertRule(schema, rule, {
        locale: latest.query.locale,
        timeZone: latest.query.timeZone,
        registry,
      });
      const checked = validateRuleDraft(
        props.controller.getDefinition().schema,
        latest.query,
        inverted,
        {
          now: latest.evaluatedAt,
          registry,
          replaceRuleId: rule.id,
        },
      );
      if (checked.status === "valid") {
        if (dispatch({ type: "builder.commit", rule: checked.rule }))
          close(`${rule.id}:operator`);
        return;
      }
    } catch {
      /* A shape-changing inverse needs a confirmed replacement draft. */
    }
    if (currentDraft)
      setDraft({
        ...currentDraft,
        operator: inverse.id,
        value: undefined,
        part: "value",
      });
  }
  function summary(rule: RuleFor<S>): ReactNode {
    const entry = fields.find((field) => field.id === rule.field);
    const presentation = entry ? props.fields[entry.id] : undefined;
    const optionView = views.get(rule.field);
    if (optionView?.context.access === false) return messages.unavailableValue;
    if (presentation?.formatValue) return presentation.formatValue(rule);
    const ids = scalarIds(rule.value);
    if (presentation?.choices || presentation?.asyncOptions)
      return ids
        .map(
          (id) =>
            presentation.choices?.find((option) => option.id === id)?.label ??
            optionView?.selected.find((option) => option.id === id)?.label ??
            String(id),
        )
        .join(", ");
    if (entry?.field.type === "date" || entry?.field.type === "datetime") {
      const date = dateOperandValue(rule.value);
      if (date && "kind" in date) {
        if (date.kind === "day" || date.kind === "instant") return date.value;
        return (
          props.dateMessages?.formatRelative ??
          dateEditorMessages.formatRelative
        )(date);
      }
      if (date) return `${date[0].value} – ${date[1].value}`;
    }
    if (
      typeof rule.value === "string" ||
      typeof rule.value === "number" ||
      typeof rule.value === "boolean"
    )
      return String(rule.value);
    if (Array.isArray(rule.value))
      return rule.value
        .map((value: unknown) =>
          typeof value === "number" || typeof value === "string"
            ? String(value)
            : "…",
        )
        .join(" – ");
    return rule.value === undefined ? "" : messages.value;
  }
  function editor(): ReactNode {
    if (!currentDraft) return null;
    const entry = fields.find((field) => field.id === currentDraft.field);
    const operators = entry
      ? getFieldOperators(schema, entry.id, registry)
      : [];
    const descriptor = operators.find(
      (operator) => operator.id === currentDraft.operator,
    );
    const presentation = entry ? props.fields[entry.id] : undefined;
    if (currentDraft.part === "options" && acceptedRule) {
      const inverse =
        descriptor?.inverse &&
        operators.some(
          (operator) =>
            operator.id === descriptor.inverse && usableOperator(operator),
        );
      return (
        <div className="tw-filter-options">
          <Button
            variant="tertiary"
            onPress={() => {
              if (!liveDraft(currentDraft)) return;
              const id = nextId();
              if (
                id &&
                dispatch({
                  type: "builder.duplicate",
                  ruleId: acceptedRule.id,
                  newRuleId: id,
                })
              )
                close(`${acceptedRule.id}:options`);
            }}
          >
            {messages.duplicate}
          </Button>
          {inverse && (
            <Button variant="tertiary" onPress={() => negate(acceptedRule)}>
              {messages.negate}
            </Button>
          )}
          <Button variant="danger" onPress={() => remove(acceptedRule)}>
            {messages.remove}
          </Button>
        </div>
      );
    }
    if (currentDraft.part === "field")
      return (
        <FieldPicker props={props} messages={messages} onChoose={chooseField} />
      );
    if (currentDraft.part === "operator")
      return (
        <ListBox
          aria-label={messages.chooseOperator}
          escapeKeyBehavior="none"
          disabledKeys={operators
            .filter((operator) => !usableOperator(operator))
            .map((operator) => operator.id)}
          onAction={(id) => {
            if (typeof id === "string") chooseOperator(id);
          }}
        >
          {operators.map((operator) => (
            <ListBox.Item
              key={operator.id}
              id={operator.id}
              textValue={operatorLabel(
                operator.id,
                presentation?.operatorLabels,
              )}
            >
              {operatorLabel(operator.id, presentation?.operatorLabels)}
            </ListBox.Item>
          ))}
        </ListBox>
      );
    if (!entry || !descriptor) return <p role="alert">{messages.invalid}</p>;
    const checked = validation(currentDraft);
    const immediate =
      descriptor.builtin &&
      (entry.field.type === "enum" || entry.field.type === "set") &&
      !presentation?.renderEditor;
    return (
      <>
        <ValueEditor
          key={`${currentDraft.id}:${entry.id}:${descriptor.id}`}
          props={props}
          fieldId={entry.id}
          field={entry.field}
          descriptor={descriptor}
          value={currentDraft.value}
          presentation={presentation}
          sourceView={views.get(entry.id)}
          acceptedRule={acceptedRule}
          validation={checked}
          onChange={(value) => {
            if (!liveDraft(currentDraft)) return;
            setDraft({ ...currentDraft, value });
            setError("");
          }}
          onChoice={(value) => submit({ ...currentDraft, value }, true)}
          onEmpty={() => {
            if (
              acceptedRule?.field === entry.id &&
              acceptedRule.operator === descriptor.id &&
              descriptor.cardinality === "many"
            )
              remove(acceptedRule);
          }}
          messages={messages}
        />
        {!immediate && descriptor.cardinality !== "none" && (
          <Button
            className="tw-confirm-action"
            isDisabled={
              (entry.field.type === "date" ||
                entry.field.type === "datetime") &&
              checked.status !== "valid"
            }
            onPress={() => submit(currentDraft)}
          >
            {messages.apply}
          </Button>
        )}
      </>
    );
  }
  function segment(
    anchor: string,
    label: string,
    text: ReactNode,
    part: Draft["part"],
    rule?: RuleFor<S>,
  ) {
    const isOpen = currentDraft?.anchor === anchor;
    const nameFromContents = anchor === "filters" || part === "value";
    return (
      <Popover
        isOpen={isOpen}
        onOpenChange={(openNow) => {
          if (!openNow && isOpen) close(anchor);
          else if (openNow && !isOpen) open(anchor, part, rule);
        }}
      >
        <Button
          ref={(element) => {
            if (element) triggers.current.set(anchor, element);
            else triggers.current.delete(anchor);
          }}
          variant="tertiary"
          className="tw-filter-segment"
          {...(nameFromContents ? {} : { "aria-label": label })}
        >
          {nameFromContents && (
            <span className="tw-filter-sr-only">{label}: </span>
          )}
          {text}
        </Button>
        <Popover.Content placement="bottom start" className="tw-filter-popover">
          <Popover.Dialog aria-label={messages.editorTitle}>
            <Popover.Heading>{messages.editorTitle}</Popover.Heading>
            {isOpen && editor()}
            {isOpen && error && <p role="alert">{error}</p>}
            <Button variant="tertiary" onPress={() => close(anchor)}>
              {messages.cancel}
            </Button>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    );
  }
  if (!props.expectedResourceContext.access)
    return <div role="status">{messages.accessUnavailable}</div>;
  return (
    <fieldset
      className={`tw-filter-builder ${props.className ?? ""}`}
      aria-label={messages.filters}
    >
      {segment("filters", messages.addRule, messages.filters, "field")}
      {state.query.builder.rules.length > 0 && (
        <>
          <fieldset aria-label={messages.join} className="tw-filter-join">
            <Button
              variant="tertiary"
              aria-pressed={state.query.builder.join === "and"}
              onPress={() => dispatch({ type: "builder.join", join: "and" })}
            >
              {messages.all}
            </Button>
            <Button
              variant="tertiary"
              aria-pressed={state.query.builder.join === "or"}
              onPress={() => dispatch({ type: "builder.join", join: "or" })}
            >
              {messages.any}
            </Button>
          </fieldset>
          {state.query.builder.rules.map((rule) => {
            const entry = fields.find((field) => field.id === rule.field);
            const presentation = entry ? props.fields[entry.id] : undefined;
            const name = presentation?.label ?? rule.field;
            const operator = operatorLabel(
              rule.operator,
              presentation?.operatorLabels,
            );
            return (
              <fieldset
                key={rule.id}
                className="tw-filter-rule"
                data-rule-id={rule.id}
                aria-label={`${name} ${operator}`}
              >
                {segment(
                  `${rule.id}:field`,
                  `${messages.field}: ${name}`,
                  name,
                  "field",
                  rule,
                )}
                {segment(
                  `${rule.id}:operator`,
                  `${messages.operator}: ${operator}`,
                  operator,
                  "operator",
                  rule,
                )}
                {registry.get(rule.operator)?.cardinality !== "none" &&
                  segment(
                    `${rule.id}:value`,
                    `${messages.value}: ${name}`,
                    <bdi>{summary(rule)}</bdi>,
                    "value",
                    rule,
                  )}
                {segment(
                  `${rule.id}:options`,
                  `${messages.options}: ${name}`,
                  "⋯",
                  "options",
                  rule,
                )}
              </fieldset>
            );
          })}
          <Button
            variant="tertiary"
            aria-label={messages.clearLabel}
            onPress={() => {
              if (dispatch({ type: "builder.clear" }, messages.cleared))
                close("filters");
            }}
          >
            {messages.clear}
          </Button>
        </>
      )}
      {!fields.length && <span>{messages.noFields}</span>}
      {error && !currentDraft && <p role="alert">{error}</p>}
      <span className="tw-filter-announcement" role="status">
        {announcement}
      </span>
    </fieldset>
  );
}

export function FilterBuilder<S extends QuerySchema>(
  props: FilterBuilderProps<S>,
) {
  return (
    <CriteriaBuilderHost
      input={props}
      Legacy={LegacyFilterBuilder}
      Surface={CriteriaBuilderSurface}
    />
  );
}
function LegacyFilterBuilder<S extends QuerySchema>(
  props: FilterBuilderProps<S>,
) {
  const state = useTableweaveState(props.controller);
  return (
    <OptionOwners props={props} rules={state.query.builder.rules}>
      <BuilderSurface props={props} state={state} />
    </OptionOwners>
  );
}

function CriteriaFieldPicker({
  handle,
}: {
  readonly handle: CriteriaBuilderEditorHandle;
}) {
  try {
    const e = readBuilderEditor(handle),
      search = e.frame.local.search.read(e.actor) ?? "",
      fields = e.fields.filter((entry) =>
        (e.frame.ports.fields[entry.id]?.label ?? entry.id)
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()),
      );
    const node = (
      <>
        <TextField
          value={search}
          onChange={(text) => safely(() => editorActions.search(handle, text))}
        >
          <Label>{e.messages.searchFields}</Label>
          <Input autoFocus />
        </TextField>
        {!fields.length ? <p>{e.messages.noFields}</p> : null}
        <ListBox
          aria-label={e.messages.chooseField}
          escapeKeyBehavior="none"
          onAction={(id) =>
            safely(() => {
              requireBuilderEditor(handle);
              if (typeof id === "string") editorActions.field(handle, id);
            })
          }
        >
          {fields.map((entry) => (
            <ListBox.Item
              key={entry.id}
              id={entry.id}
              textValue={e.frame.ports.fields[entry.id]?.label ?? entry.id}
            >
              {e.frame.ports.fields[entry.id]?.label ?? entry.id}
            </ListBox.Item>
          ))}
        </ListBox>
      </>
    );
    requireBuilderEditor(handle);
    return node;
  } catch {
    return null;
  }
}
function CriteriaBuilderEditor({
  handle,
}: {
  readonly handle: CriteriaBuilderEditorHandle;
}) {
  try {
    const e = readBuilderEditor(handle);
    if (!e.draft) return null;
    const entry = e.fields.find((item) => item.id === e.draft?.field),
      operators = entry
        ? getFieldOperators(
            e.schema,
            entry.id,
            builderRegistry(e.store, e.actor, e.draft),
          )
        : [],
      descriptor = operators.find((item) => item.id === e.draft?.operator),
      presentation = entry ? e.frame.ports.fields[entry.id] : undefined;
    const usable = (item: OperatorDescriptor) =>
      e.frame.ports.evaluationMode === "server" ||
      item.builtin ||
      typeof item.custom?.evaluate === "function";
    if (e.draft.part === "options") {
      const inverse =
        descriptor?.inverse &&
        operators.some(
          (item) => item.id === descriptor.inverse && usable(item),
        );
      const node = (
        <div className="tw-filter-options">
          <Button
            variant="tertiary"
            onPress={() => safely(() => editorActions.duplicate(handle))}
          >
            {e.messages.duplicate}
          </Button>
          {inverse ? (
            <Button
              variant="tertiary"
              onPress={() => safely(() => editorActions.negate(handle))}
            >
              {e.messages.negate}
            </Button>
          ) : null}
          <Button
            variant="danger"
            onPress={() => safely(() => editorActions.remove(handle))}
          >
            {e.messages.remove}
          </Button>
        </div>
      );
      requireBuilderEditor(handle);
      return node;
    }
    if (e.draft.part === "field")
      return <CriteriaFieldPicker handle={handle} />;
    if (e.draft.part === "operator") {
      const node = (
        <ListBox
          aria-label={e.messages.chooseOperator}
          escapeKeyBehavior="none"
          disabledKeys={operators
            .filter((item) => !usable(item))
            .map((item) => item.id)}
          onAction={(id) =>
            safely(() => {
              requireBuilderEditor(handle);
              if (typeof id === "string") editorActions.operator(handle, id);
            })
          }
        >
          {operators.map((item) => (
            <ListBox.Item
              key={item.id}
              id={item.id}
              textValue={operatorLabel(item.id, presentation?.operatorLabels)}
            >
              {operatorLabel(item.id, presentation?.operatorLabels)}
            </ListBox.Item>
          ))}
        </ListBox>
      );
      requireBuilderEditor(handle);
      return node;
    }
    if (!entry || !descriptor) return <p role="alert">{e.messages.invalid}</p>;
    const checked = validateBuilder(e.store, e.actor, e.draft),
      immediate =
        descriptor.builtin &&
        (entry.field.type === "enum" || entry.field.type === "set") &&
        !presentation?.renderEditor;
    // The internal adopted alternative consumes only the genuine registered
    // handle; it never reconstructs raw props or manufactures a draft receipt.
    const node = (
      <>
        <ValueEditor criteriaEditor={handle} />
        {!immediate && descriptor.cardinality !== "none" ? (
          <Button
            className="tw-confirm-action"
            isDisabled={
              (entry.field.type === "date" ||
                entry.field.type === "datetime") &&
              checked.status !== "valid"
            }
            onPress={() => safely(() => editorActions.apply(handle))}
          >
            {e.messages.apply}
          </Button>
        ) : null}
      </>
    );
    requireBuilderEditor(handle);
    return node;
  } catch {
    return null;
  }
}
function CriteriaBuilderSurface<S extends QuerySchema>({
  store,
}: {
  readonly store: CriteriaBuilderStore<S>;
}) {
  const version = useCriteriaBuilderVersion(store),
    frame = store.read(),
    actor = frame?.actor,
    triggers = useRef(new Map<string, HTMLButtonElement>());
  useLayoutEffect(() => {
    if (!actor || store.snapshot() !== version) return;
    safely(() => {
      reconcileBuilder(store, actor);
      const current = store.require(actor),
        plan = current.local.focus.read(actor);
      if (!plan || (plan.actor === actor && plan.work)) return;
      if (plan.work) current.cell.cancelWork(actor, plan.work);
      const work = current.cell.animationFrame(actor, () => {
        try {
          const checked = store.require(actor),
            active = checked.local.focus.read(actor);
          if (active?.token !== plan.token) return undefined;
          const target =
            triggers.current.get(plan.anchor) ??
            triggers.current.get("filters");
          store.require(actor);
          target?.focus();
          store.require(actor);
          if (checked.local.focus.read(actor) === active)
            checked.local.focus.clear(actor);
        } catch {
          /* Saved A focus cannot reach B. */
        }
        return undefined;
      });
      current.local.focus.write(actor, { ...plan, actor, work });
    });
  }, [store, actor, version]);
  let content: ReactNode = (
    <div role="status">{builderMessages.accessUnavailable}</div>
  );
  if (frame && actor)
    try {
      const e = builderState(store, actor),
        { state, fields, messages, draft } = e,
        handle = draft ? builderEditor(store, actor) : null,
        error = frame.local.error.read(actor) ?? "",
        announcement = frame.local.announcement.read(actor) ?? "",
        receipt = frame.local.receipt.read(actor)?.token;
      const checkRender = () => {
        store.require(actor);
        if (
          JSON.stringify(
            frame.origin.controller.getSnapshot().query.builder,
          ) !== JSON.stringify(state.query.builder)
        )
          throw new Error("Criteria builder unavailable");
      };
      const checkVersion = (before: object) => {
        if (frame.cell.getSnapshot().version !== before)
          throw new Error("Criteria builder unavailable");
      };
      const invokeRender = <V,>(
        field: BuilderFieldId<S> | undefined,
        callback: () => V,
      ): V => {
        checkRender();
        if (field && frame.ports.fields[field]?.asyncOptions)
          store.option(actor, field);
        const before = frame.cell.getSnapshot().version;
        try {
          return callback();
        } finally {
          checkRender();
          if (field && frame.ports.fields[field]?.asyncOptions)
            store.option(actor, field);
          checkVersion(before);
        }
      };
      const summary = (rule: RuleFor<S>): ReactNode => {
        checkRender();
        const entry = fields.find((item) => item.id === rule.field),
          presentation = entry ? frame.ports.fields[entry.id] : undefined;
        if (presentation?.asyncOptions) {
          try {
            if (!entry) return messages.unavailableValue;
            criteriaOptionView(store, actor, entry.id);
          } catch {
            return messages.unavailableValue;
          }
        }
        if (presentation?.formatValue) {
          const format = presentation.formatValue;
          return invokeRender(entry?.id, () => format.call(presentation, rule));
        }
        const ids = scalarIds(rule.value);
        if (presentation?.choices || presentation?.asyncOptions) {
          const view =
            presentation.asyncOptions && entry
              ? criteriaOptionView(store, actor, entry.id)
              : undefined;
          const result = ids
            .map(
              (id) =>
                presentation.choices?.find((option) => option.id === id)
                  ?.label ??
                view?.selected.find((option) => option.id === id)?.label ??
                String(id),
            )
            .join(", ");
          store.require(actor);
          return result;
        }
        if (entry?.field.type === "date" || entry?.field.type === "datetime") {
          const value = dateOperandValue(rule.value);
          if (value && "kind" in value) {
            if (value.kind === "day" || value.kind === "instant")
              return value.value;
            return invokeRender(entry.id, () =>
              (
                frame.ports.dateMessages?.formatRelative ??
                dateEditorMessages.formatRelative
              )(value),
            );
          }
          if (value) return `${value[0].value} – ${value[1].value}`;
        }
        if (
          typeof rule.value === "string" ||
          typeof rule.value === "number" ||
          typeof rule.value === "boolean"
        )
          return String(rule.value);
        if (Array.isArray(rule.value))
          return rule.value
            .map((value: unknown) =>
              typeof value === "string" || typeof value === "number"
                ? String(value)
                : "…",
            )
            .join(" – ");
        return rule.value === undefined ? "" : messages.value;
      };
      const segment = (
        anchor: string,
        label: string,
        text: ReactNode,
        part: BuilderDraft["part"],
        ruleId?: string,
      ) => {
        const isOpen = draft?.anchor === anchor,
          nameFromContents = anchor === "filters" || part === "value",
          edit = handle;
        return (
          <Popover
            isOpen={isOpen}
            onOpenChange={(open) =>
              safely(() => {
                store.require(actor);
                if (!open && isOpen && edit) editorActions.cancel(edit);
                else if (open && !isOpen && receipt)
                  builderActions.open(
                    store,
                    actor,
                    anchor,
                    part,
                    receipt,
                    ruleId,
                  );
              })
            }
          >
            <Button
              ref={(element) => {
                if (element) triggers.current.set(anchor, element);
                else triggers.current.delete(anchor);
              }}
              variant="tertiary"
              className="tw-filter-segment"
              {...(nameFromContents ? {} : { "aria-label": label })}
            >
              {nameFromContents ? (
                <span className="tw-filter-sr-only">{label}: </span>
              ) : null}
              {text}
            </Button>
            <Popover.Content
              placement="bottom start"
              className="tw-filter-popover"
            >
              <Popover.Dialog aria-label={messages.editorTitle}>
                <Popover.Heading>{messages.editorTitle}</Popover.Heading>
                {isOpen && edit ? (
                  <CriteriaBuilderEditor handle={edit} />
                ) : null}
                {isOpen && error ? <p role="alert">{error}</p> : null}
                <Button
                  variant="tertiary"
                  onPress={() =>
                    safely(() => {
                      if (edit) editorActions.cancel(edit);
                    })
                  }
                >
                  {messages.cancel}
                </Button>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        );
      };
      const node = (
        <fieldset
          className={`tw-filter-builder ${frame.className}`}
          aria-label={messages.filters}
        >
          {segment("filters", messages.addRule, messages.filters, "field")}
          {state.query.builder.rules.length ? (
            <>
              <fieldset aria-label={messages.join} className="tw-filter-join">
                <Button
                  variant="tertiary"
                  aria-pressed={state.query.builder.join === "and"}
                  onPress={() =>
                    safely(() => {
                      if (receipt)
                        builderActions.join(store, actor, "and", receipt);
                    })
                  }
                >
                  {messages.all}
                </Button>
                <Button
                  variant="tertiary"
                  aria-pressed={state.query.builder.join === "or"}
                  onPress={() =>
                    safely(() => {
                      if (receipt)
                        builderActions.join(store, actor, "or", receipt);
                    })
                  }
                >
                  {messages.any}
                </Button>
              </fieldset>
              {state.query.builder.rules.map((rule) => {
                store.require(actor);
                const id = rule.id,
                  entry = fields.find((item) => item.id === rule.field),
                  presentation = entry
                    ? frame.ports.fields[entry.id]
                    : undefined,
                  name = presentation?.label ?? rule.field,
                  operator = operatorLabel(
                    rule.operator,
                    presentation?.operatorLabels,
                  ),
                  descriptor = builderRegistry(store, actor).get(rule.operator);
                return (
                  <fieldset
                    key={id}
                    className="tw-filter-rule"
                    data-rule-id={id}
                    aria-label={`${name} ${operator}`}
                  >
                    {segment(
                      `${id}:field`,
                      `${messages.field}: ${name}`,
                      name,
                      "field",
                      id,
                    )}
                    {segment(
                      `${id}:operator`,
                      `${messages.operator}: ${operator}`,
                      operator,
                      "operator",
                      id,
                    )}
                    {descriptor?.cardinality !== "none"
                      ? segment(
                          `${id}:value`,
                          `${messages.value}: ${name}`,
                          <bdi>{summary(rule)}</bdi>,
                          "value",
                          id,
                        )
                      : null}
                    {segment(
                      `${id}:options`,
                      `${messages.options}: ${name}`,
                      "⋯",
                      "options",
                      id,
                    )}
                  </fieldset>
                );
              })}
              <Button
                variant="tertiary"
                aria-label={messages.clearLabel}
                onPress={() =>
                  safely(() => {
                    if (receipt) builderActions.clear(store, actor, receipt);
                  })
                }
              >
                {messages.clear}
              </Button>
            </>
          ) : null}
          {!fields.length ? <span>{messages.noFields}</span> : null}
          {error && !draft ? <p role="alert">{error}</p> : null}
          <span className="tw-filter-announcement" role="status">
            {announcement}
          </span>
        </fieldset>
      );
      checkRender();
      if (draft && handle) requireBuilderEditor(handle);
      content = node;
    } catch {
      /* No private candidate fallback. */
    }
  return (
    <>
      <CriteriaOptionOwners store={store} />
      {content}
    </>
  );
}
