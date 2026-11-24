"use client";

import { Button } from "@heroui/react/button";
import { Input } from "@heroui/react/input";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { TextField } from "@heroui/react/textfield";
import type { ResourceContext } from "@tableweave/react";
import type {
  FieldDefinition,
  QuerySchema,
  RuleFor,
  ScalarId,
} from "@tableweave/react/contracts";
import type {
  BuilderFieldId,
  FilterOption,
  OperatorDescriptor,
  OptionSourceView,
  RuleDraftResult,
} from "@tableweave/react/filters";
import { projectOptionSourceView } from "@tableweave/react/filters";
import { useId, useState } from "react";
import { DateOperandEditor } from "../date/date-operand-editor.js";
import { dateOperandValue } from "./date-value.js";
import { acceptedOptionIds, scalarIds } from "./option-owners.js";
import type {
  FilterBuilderMessages,
  FilterBuilderProps,
  FilterFieldPresentation,
  FilterOptionPort,
} from "./types.js";

export function requestOptions(
  port: FilterOptionPort,
  expected: ResourceContext,
  fieldId: string,
  term: string,
  pageKey: string,
) {
  if (!expected.access) return;
  const request = port.source.begin({
    ...expected,
    fieldId,
    term,
    pageKey,
    retry: port.onRequest,
  });
  if (!request) return;
  try {
    const work = port.onRequest(request);
    if (work !== undefined)
      void Promise.resolve(work).catch(() =>
        port.source.fail(request, "unavailable"),
      );
  } catch {
    port.source.fail(request, "unavailable");
  }
}

export function choiceKey(id: ScalarId): string {
  return `${typeof id}:${String(id)}`;
}

function numericInput(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed))
    return text;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : text;
}
function NumericEditor({
  value,
  range,
  onChange,
  messages,
}: {
  readonly value: unknown;
  readonly range: boolean;
  readonly onChange: (value: unknown) => void;
  readonly messages: FilterBuilderMessages;
}) {
  const [texts, setTexts] = useState(() =>
    range
      ? [
          Array.isArray(value) && typeof value[0] === "number"
            ? String(value[0])
            : "",
          Array.isArray(value) && typeof value[1] === "number"
            ? String(value[1])
            : "",
        ]
      : [typeof value === "number" ? String(value) : ""],
  );
  return (
    <div className="tw-filter-value-range">
      {texts.map((text, index) => (
        <TextField
          key={index === 0 ? "first" : "last"}
          value={text}
          onChange={(nextText) => {
            const next = texts.map((old, position) =>
              position === index ? nextText : old,
            );
            setTexts(next);
            onChange(range ? next.map(numericInput) : numericInput(nextText));
          }}
        >
          <Label>
            {range
              ? index === 0
                ? messages.from
                : messages.to
              : messages.value}
          </Label>
          <Input inputMode="decimal" />
        </TextField>
      ))}
    </div>
  );
}

function DateEditor<S extends QuerySchema>({
  props,
  field,
  cardinality,
  value,
  onChange,
}: {
  readonly props: FilterBuilderProps<S>;
  readonly field: Extract<
    FieldDefinition,
    { readonly type: "date" | "datetime" }
  >;
  readonly cardinality: "one" | "range";
  readonly value: unknown;
  readonly onChange: (value: unknown) => void;
}) {
  const resetKey = useId();
  // The primitive's value seeds a session; parent draft notifications must not
  // become a controlled mirror which resets partially entered date segments.
  const [seed] = useState(() => dateOperandValue(value));
  const accepted = props.controller.getSnapshot();
  const common = {
    field,
    resetKey,
    disabled: !props.expectedResourceContext.access,
    messages: props.dateMessages ?? {},
    context: {
      locale: accepted.query.locale,
      timeZone: accepted.query.timeZone,
      evaluatedAt: accepted.evaluatedAt,
    },
  };
  return cardinality === "one" ? (
    <DateOperandEditor
      {...common}
      cardinality="one"
      value={seed && "kind" in seed ? seed : null}
      onDraftChange={(draft) =>
        onChange(
          draft.status === "complete"
            ? draft.value
            : draft.status === "invalid"
              ? null
              : undefined,
        )
      }
    />
  ) : (
    <DateOperandEditor
      {...common}
      cardinality="range"
      value={seed && !("kind" in seed) ? seed : null}
      onDraftChange={(draft) =>
        onChange(
          draft.status === "complete"
            ? draft.value
            : draft.status === "invalid"
              ? null
              : undefined,
        )
      }
    />
  );
}

function Choices({
  fieldId,
  descriptor,
  presentation,
  sourceView,
  acceptedRule,
  getAcceptedIds,
  expected,
  onChoice,
  onEmpty,
  messages,
}: {
  readonly fieldId: string;
  readonly descriptor: OperatorDescriptor;
  readonly presentation: FilterFieldPresentation<QuerySchema> | undefined;
  readonly sourceView: OptionSourceView<ScalarId> | undefined;
  readonly acceptedRule:
    | {
        readonly field: string;
        readonly operator: string;
        readonly value?: unknown;
      }
    | undefined;
  readonly expected: ResourceContext;
  readonly getAcceptedIds: () => readonly ScalarId[];
  readonly onChoice: (value: unknown) => void;
  readonly onEmpty: () => void;
  readonly messages: FilterBuilderMessages;
}) {
  const [term, setTerm] = useState(
    () => sourceView?.page?.request.term ?? sourceView?.request?.term ?? "",
  );
  const [choiceNotice, setChoiceNotice] = useState("");
  const port = presentation?.asyncOptions;
  const selected =
    acceptedRule?.field === fieldId && acceptedRule.operator === descriptor.id
      ? scalarIds(acceptedRule.value)
      : [];
  const values = new Map<ScalarId, FilterOption>();
  if (port) {
    for (const option of sourceView?.selected ?? [])
      values.set(option.id, option);
    for (const option of sourceView?.page?.options ?? [])
      values.set(option.id, option);
  } else {
    for (const id of selected) values.set(id, { id, label: String(id) });
    for (const option of presentation?.choices ?? [])
      values.set(option.id, option);
  }
  const options = [...values.values()];
  const enabled = !port || sourceView?.canChoose === true;
  return (
    <div className="tw-filter-choices">
      {port && (
        <TextField
          value={term}
          onChange={(next) => {
            setChoiceNotice("");
            setTerm(next);
            requestOptions(port, expected, fieldId, next, "first");
          }}
        >
          <Label>{messages.searchOptions}</Label>
          <Input />
        </TextField>
      )}
      {sourceView?.busy && <p role="status">{messages.loading}</p>}
      {(sourceView?.display === "error" ||
        sourceView?.notice === "load-failed") && (
        <div role="alert">
          {messages.optionsFailed}
          {sourceView.canRetry && (
            <Button
              variant="tertiary"
              onPress={() => {
                const current = port?.source.getSnapshot();
                if (
                  current?.canRetry &&
                  current.request === sourceView.request &&
                  expected.access &&
                  current.context.access &&
                  current.context.definitionKey === expected.definitionKey &&
                  current.context.scopeKey === expected.scopeKey &&
                  current.context.fieldId === fieldId
                )
                  port?.source.retry();
              }}
            >
              {messages.retry}
            </Button>
          )}
        </div>
      )}
      {port && sourceView?.display === "idle" && (
        <Button
          variant="tertiary"
          onPress={() => requestOptions(port, expected, fieldId, term, "first")}
        >
          {messages.searchOptions}
        </Button>
      )}
      {sourceView?.display === "blocked" && (
        <p role="status">{messages.accessUnavailable}</p>
      )}
      {((!port && !options.length) || sourceView?.display === "empty") && (
        <p role="status">{messages.emptyOptions}</p>
      )}
      {choiceNotice && <p role="status">{choiceNotice}</p>}
      <ListBox
        aria-label={messages.chooseValue}
        escapeKeyBehavior="none"
        selectionMode={
          descriptor.cardinality === "many" ? "multiple" : "single"
        }
        selectedKeys={new Set(selected.map(choiceKey))}
        disallowEmptySelection={descriptor.cardinality !== "many"}
        disabledKeys={options
          .filter((option) => !enabled || option.disabled)
          .map((option) => choiceKey(option.id))}
        onSelectionChange={(keys) => {
          if (keys === "all" || !enabled) return;
          const next = options
            .filter((option) => keys.has(choiceKey(option.id)))
            .map((option) => option.id);
          if (port) {
            // A connected option can receive its discrete event before React
            // renders a new source frame. Rendering-time enabled/disabled state
            // is not current choice authority, even if rule/context are unchanged.
            const current = projectOptionSourceView<ScalarId>(
              port.source.getSnapshot(),
              { ...expected, fieldId },
              getAcceptedIds(),
            );
            const eligible = new Map<ScalarId, FilterOption>();
            for (const option of current.selected)
              eligible.set(option.id, option);
            for (const option of current.page?.options ?? [])
              eligible.set(option.id, option);
            const changed =
              descriptor.cardinality === "many"
                ? [
                    ...selected.filter((id) => !next.includes(id)),
                    ...next.filter((id) => !selected.includes(id)),
                  ]
                : next;
            if (
              !current.canChoose ||
              !sourceView?.request ||
              current.request !== sourceView.request ||
              !sourceView.page ||
              !current.page ||
              current.page !== sourceView.page ||
              current.page.request !== sourceView.page.request ||
              next.length !== keys.size ||
              changed.some(
                (id) =>
                  !eligible.has(id) || eligible.get(id)?.disabled === true,
              )
            ) {
              setChoiceNotice(messages.staleDraft);
              return;
            }
          }
          setChoiceNotice("");
          if (descriptor.cardinality === "many")
            next.length ? onChoice(next) : onEmpty();
          else if (next.length === 1) onChoice(next[0]);
        }}
      >
        {options.map((option) => (
          <ListBox.Item
            key={choiceKey(option.id)}
            id={choiceKey(option.id)}
            textValue={option.label}
          >
            {option.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
      {port &&
        sourceView?.canLoadMore &&
        sourceView.page?.request.term === term &&
        port.nextPageKey && (
          <Button
            variant="tertiary"
            onPress={() => {
              const current = port.source.getSnapshot();
              const displayed = sourceView.page?.request;
              if (
                !displayed ||
                !current.canLoadMore ||
                current.page?.request !== displayed ||
                current.request !== sourceView.request ||
                current.context.definitionKey !== expected.definitionKey ||
                current.context.scopeKey !== expected.scopeKey ||
                current.context.fieldId !== fieldId ||
                !expected.access ||
                !current.context.access ||
                displayed.term !== term
              )
                return;
              try {
                const next = port.nextPageKey?.(displayed);
                if (
                  next !== null &&
                  next !== undefined &&
                  port.source.getSnapshot() === current
                )
                  requestOptions(port, expected, fieldId, displayed.term, next);
              } catch {
                if (current.request)
                  port.source.fail(current.request, "unavailable");
              }
            }}
          >
            {messages.nextOptions}
          </Button>
        )}
    </div>
  );
}

export function ValueEditor<S extends QuerySchema>({
  props,
  fieldId,
  field,
  descriptor,
  value,
  presentation,
  sourceView,
  acceptedRule,
  validation,
  onChange,
  onChoice,
  onEmpty,
  messages,
}: {
  readonly props: FilterBuilderProps<S>;
  readonly fieldId: BuilderFieldId<S>;
  readonly field: FieldDefinition;
  readonly descriptor: OperatorDescriptor;
  readonly value: unknown;
  readonly presentation: FilterFieldPresentation<S> | undefined;
  readonly sourceView: OptionSourceView<ScalarId> | undefined;
  readonly acceptedRule: RuleFor<S> | undefined;
  readonly validation: RuleDraftResult<S>;
  readonly onChange: (value: unknown) => void;
  readonly onChoice: (value: unknown) => void;
  readonly onEmpty: () => void;
  readonly messages: FilterBuilderMessages;
}) {
  const state = props.controller.getSnapshot();
  if (descriptor.cardinality === "none") return null;
  if (!descriptor.builtin || presentation?.renderEditor) {
    return presentation?.renderEditor ? (
      presentation.renderEditor({
        fieldId,
        field,
        operator: descriptor,
        value,
        acceptedRule,
        validation,
        locale: state.query.locale,
        timeZone: state.query.timeZone,
        evaluatedAt: state.evaluatedAt,
        isDisabled: !props.expectedResourceContext.access,
        onChange,
      })
    ) : (
      <p role="alert">{messages.customEditorMissing}</p>
    );
  }
  if (field.type === "number")
    return (
      <NumericEditor
        key={`${fieldId}:${descriptor.id}`}
        value={value}
        range={descriptor.cardinality === "range"}
        onChange={onChange}
        messages={messages}
      />
    );
  if (field.type === "enum" || field.type === "set") {
    // Choices expose only labels/ports and never invoke a field-specific renderer.
    const choicesPresentation = {
      label: presentation?.label ?? fieldId,
      choices:
        presentation?.choices ??
        field.values?.map((id) => ({ id, label: String(id) })) ??
        [],
      ...(presentation?.asyncOptions
        ? { asyncOptions: presentation.asyncOptions }
        : {}),
    };
    return (
      <Choices
        fieldId={fieldId}
        descriptor={descriptor}
        presentation={choicesPresentation}
        sourceView={sourceView}
        acceptedRule={acceptedRule}
        getAcceptedIds={() =>
          acceptedOptionIds(
            props.controller.getSnapshot().query.builder.rules,
            fieldId,
          )
        }
        expected={props.expectedResourceContext}
        onChoice={onChoice}
        onEmpty={onEmpty}
        messages={messages}
      />
    );
  }
  if (
    (field.type === "date" || field.type === "datetime") &&
    (descriptor.cardinality === "one" || descriptor.cardinality === "range")
  )
    return (
      <DateEditor
        props={props}
        field={field}
        cardinality={descriptor.cardinality}
        value={value}
        onChange={onChange}
      />
    );
  return (
    <TextField
      value={typeof value === "string" ? value : ""}
      onChange={onChange}
    >
      <Label>{messages.value}</Label>
      <Input />
    </TextField>
  );
}
