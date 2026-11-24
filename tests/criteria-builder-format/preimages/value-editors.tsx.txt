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
import { useId, useState,useLayoutEffect } from "react";
import { DateOperandEditor } from "../date/date-operand-editor.js";
import { dateOperandValue } from "./date-value.js";
import { acceptedOptionIds, scalarIds } from "./option-owners.js";
import type {
  FilterBuilderMessages,
  FilterBuilderProps,
  FilterFieldPresentation,
  FilterOptionPort,
} from "./types.js";
import type { CriteriaBuilderEditorHandle } from "./criteria-builder-host.js";
import { readBuilderEditor,requireBuilderEditor,useBuilderEditorVersion,useBuilderEditorRoute,builderRegistry,validateBuilder,editorActions,safely } from "./criteria-builder-host.js";
import { criteriaOptionView,criteriaRequestOptions,criteriaChoiceReceipt } from "./option-owners.js";
import { getFieldOperators } from "@tableweave/react/filters";
import { readCriteriaDateToolbar } from "../date/criteria-date-state.js";

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

function LegacyValueEditor<S extends QuerySchema>({
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

export function ValueEditor<S extends QuerySchema>(props:Parameters<typeof LegacyValueEditor<S>>[0]|{readonly criteriaEditor:CriteriaBuilderEditorHandle}) {
  const route=useBuilderEditorRoute(props);if(route==="legacy")return <LegacyValueEditor {...props as Parameters<typeof LegacyValueEditor<S>>[0]}/>;if(route==="denied")return null;return <CriteriaValueEditor handle={route}/>;
}
function CriteriaValueEditor({handle}:{readonly handle:CriteriaBuilderEditorHandle}) {
  const version=useBuilderEditorVersion(handle);
  useLayoutEffect(()=>{void version;safely(()=>{const e=readBuilderEditor(handle);if(!e.draft)return;const entry=e.fields.find(item=>item.id===e.draft?.field);if(entry&&e.frame.ports.fields[entry.id]?.asyncOptions){const start=e.frame.local.term.read(e.actor)===null,view=criteriaOptionView(e.store,e.actor,entry.id);criteriaChoiceReceipt(handle);if(start&&view.display==="idle")criteriaRequestOptions(handle,"","first");}});},[handle,version]);
  try{
    const e=readBuilderEditor(handle);if(!e.draft)return null;const entry=e.fields.find(item=>item.id===e.draft?.field),descriptor=entry?getFieldOperators(e.schema,entry.id,builderRegistry(e.store,e.actor,e.draft)).find(item=>item.id===e.draft?.operator):undefined;if(!entry||!descriptor||descriptor.cardinality==="none")return null;
    const presentation=e.frame.ports.fields[entry.id],validation=validateBuilder(e.store,e.actor,e.draft);
    if(presentation?.asyncOptions)e.store.option(e.actor,entry.id);
    if(!descriptor.builtin||presentation?.renderEditor){if(!presentation?.renderEditor)return <p role="alert">{e.messages.customEditorMissing}</p>;requireBuilderEditor(handle);const before=e.frame.cell.getSnapshot().version;const node=presentation.renderEditor({fieldId:entry.id,field:entry.field,operator:descriptor,value:e.draft.value,acceptedRule:e.state.query.builder.rules.find(rule=>rule.id===e.draft?.id),validation,locale:e.state.query.locale,timeZone:e.state.query.timeZone,evaluatedAt:e.state.evaluatedAt,isDisabled:false,onChange:value=>safely(()=>editorActions.change(handle,value))});requireBuilderEditor(handle);if(e.frame.cell.getSnapshot().version!==before)throw new Error("Criteria editor unavailable");return node;}
    if(entry.field.type==="number"){
      const texts=e.frame.local.numbers.read(e.actor)??[],range=descriptor.cardinality==="range";const node=<div className="tw-filter-value-range">{texts.map((text,index)=><TextField key={index===0?"first":"last"} value={text} onChange={next=>safely(()=>editorActions.number(handle,index,next))}><Label>{range?index===0?e.messages.from:e.messages.to:e.messages.value}</Label><Input inputMode="decimal"/></TextField>)}</div>;requireBuilderEditor(handle);return node;
    }
    if(entry.field.type==="enum"||entry.field.type==="set")return <CriteriaChoices handle={handle}/>;
    if((entry.field.type==="date"||entry.field.type==="datetime")&&(descriptor.cardinality==="one"||descriptor.cardinality==="range")){
      const date=readCriteriaDateToolbar(e.frame.local.date,e.actor);if(!date.handle)return null;const common={criteriaState:date.handle,field:entry.field,resetKey:0,context:{locale:e.state.query.locale,timeZone:e.state.query.timeZone,evaluatedAt:e.state.evaluatedAt},onDraftChange:()=>undefined};return descriptor.cardinality==="one"?<DateOperandEditor {...common} cardinality="one" value={null}/>:<DateOperandEditor {...common} cardinality="range" value={null}/>;
    }
    const node=<TextField value={typeof e.draft.value==="string"?e.draft.value:""} onChange={value=>safely(()=>editorActions.change(handle,value))}><Label>{e.messages.value}</Label><Input/></TextField>;requireBuilderEditor(handle);return node;
  }catch{return <p role="status">{builderUnavailable}</p>;}
}
const builderUnavailable="The filter value is unavailable.";
function CriteriaChoices({handle}:{readonly handle:CriteriaBuilderEditorHandle}) {
  useBuilderEditorVersion(handle);
  try{
    const e=readBuilderEditor(handle);if(!e.draft)return null;const entry=e.fields.find(item=>item.id===e.draft?.field);if(!entry||(entry.field.type!=="enum"&&entry.field.type!=="set"))return null;const descriptor=getFieldOperators(e.schema,entry.id,builderRegistry(e.store,e.actor,e.draft)).find(item=>item.id===e.draft?.operator);if(!descriptor)return null;
    const field=entry.field,presentation=e.frame.ports.fields[entry.id],port=presentation?.asyncOptions,view=port?criteriaOptionView(e.store,e.actor,entry.id):undefined,rule=e.state.query.builder.rules.find(item=>item.id===e.draft?.id),selected=rule?.field===entry.id&&rule.operator===descriptor.id?scalarIds(rule.value):[];
    const options=new Map<ScalarId,FilterOption>();if(port){for(const option of view?.selected??[])options.set(option.id,option);for(const option of view?.page?.options??[])options.set(option.id,option);}else{for(const id of selected)options.set(id,{id,label:String(id)});for(const option of presentation?.choices??entry.field.values?.map(id=>({id,label:String(id)}))??[])options.set(option.id,option);}
    const term=e.frame.local.term.read(e.actor)??view?.page?.request.term??view?.request?.term??"",notice=e.frame.local.choiceNotice.read(e.actor)??"",receipt=e.frame.local.choiceReceipt.read(e.actor)?.token??null,hasAsync=port!==undefined;
    const choose=(keys:"all"|Set<unknown>)=>safely(()=>{
      const current=readBuilderEditor(handle);if(!current.draft||keys==="all")return;const livePort=hasAsync?current.store.option(current.actor,entry.id):undefined,latest=livePort?criteriaOptionView(current.store,current.actor,entry.id):undefined,owned=current.frame.local.choiceReceipt.read(current.actor);
      if(livePort&&(!receipt||owned?.token!==receipt||owned.source!==livePort.source||owned.request!==latest?.request||owned.page!==latest?.page||!latest?.canChoose)){current.frame.local.choiceNotice.write(current.actor,current.messages.staleDraft);return;}
      const sourceSnapshot=livePort?.source.getSnapshot(),version=current.frame.cell.getSnapshot().version,currentRule=current.state.query.builder.rules.find(item=>item.id===current.draft?.id),accepted=currentRule?.field===entry.id&&currentRule.operator===descriptor.id?scalarIds(currentRule.value):[],available=new Map<ScalarId,FilterOption>();
      if(livePort){for(const option of latest?.selected??[])available.set(option.id,option);for(const option of latest?.page?.options??[])available.set(option.id,option);}else{for(const id of accepted)available.set(id,{id,label:String(id)});for(const option of current.frame.ports.fields[entry.id]?.choices??field.values?.map(id=>({id,label:String(id)}))??[])available.set(option.id,option);}
      const next:ScalarId[]=[];for(const option of available.values()){requireBuilderEditor(handle);const included=keys.has(choiceKey(option.id));requireBuilderEditor(handle);if(included)next.push(option.id);}
      const changed=descriptor.cardinality==="many"?[...accepted.filter(id=>!next.includes(id)),...next.filter(id=>!accepted.includes(id))]:next;
      const size=keys.size;requireBuilderEditor(handle);if(current.frame.cell.getSnapshot().version!==version)return;if(livePort){current.store.option(current.actor,entry.id);if(livePort.source.getSnapshot()!==sourceSnapshot)return;}if(next.length!==size||changed.some(id=>!available.has(id)||available.get(id)?.disabled)){current.frame.local.choiceNotice.write(current.actor,current.messages.staleDraft);return;}
      current.frame.local.choiceNotice.clear(current.actor);if(descriptor.cardinality==="many"){if(next.length)editorActions.apply(handle,next,true);else if(currentRule?.field===entry.id&&currentRule.operator===descriptor.id)editorActions.remove(handle);}else if(next.length===1)editorActions.apply(handle,next[0],true);
    });
    const node=<div className="tw-filter-choices">{port?<TextField value={term} onChange={next=>safely(()=>{const current=readBuilderEditor(handle);current.frame.local.term.write(current.actor,next);current.frame.local.choiceNotice.clear(current.actor);criteriaRequestOptions(handle,next,"first");})}><Label>{e.messages.searchOptions}</Label><Input/></TextField>:null}
      {view?.busy?<p role="status">{e.messages.loading}</p>:null}
      {view?.display==="error"||view?.notice==="load-failed"?<div role="alert">{e.messages.optionsFailed}{view?.canRetry?<Button variant="tertiary" onPress={()=>safely(()=>{const current=readBuilderEditor(handle),latest=criteriaOptionView(current.store,current.actor,entry.id);if(latest.canRetry&&latest.request)criteriaRequestOptions(handle,latest.request.term,latest.request.pageKey);})}>{e.messages.retry}</Button>:null}</div>:null}
      {port&&view?.display==="idle"?<Button variant="tertiary" onPress={()=>safely(()=>{const current=readBuilderEditor(handle);criteriaRequestOptions(handle,current.frame.local.term.read(current.actor)??"","first");})}>{e.messages.searchOptions}</Button>:null}
      {view?.display==="blocked"?<p role="status">{e.messages.accessUnavailable}</p>:null}{(!port&&!options.size)||view?.display==="empty"?<p role="status">{e.messages.emptyOptions}</p>:null}{notice?<p role="status">{notice}</p>:null}
      <ListBox aria-label={e.messages.chooseValue} escapeKeyBehavior="none" selectionMode={descriptor.cardinality==="many"?"multiple":"single"} selectedKeys={new Set(selected.map(choiceKey))} disallowEmptySelection={descriptor.cardinality!=="many"} disabledKeys={[...options.values()].filter(option=>(port&&view?.canChoose!==true)||option.disabled).map(option=>choiceKey(option.id))} onSelectionChange={keys=>choose(keys)}>{[...options.values()].map(option=><ListBox.Item key={choiceKey(option.id)} id={choiceKey(option.id)} textValue={option.label}>{option.label}<ListBox.ItemIndicator/></ListBox.Item>)}</ListBox>
      {port&&view?.canLoadMore&&view.page?.request.term===term&&port.nextPageKey?<Button variant="tertiary" onPress={()=>safely(()=>{const current=readBuilderEditor(handle),latest=criteriaOptionView(current.store,current.actor,entry.id),actual=current.store.option(current.actor,entry.id);if(!latest.canLoadMore||!latest.page||latest.page.request.term!==(current.frame.local.term.read(current.actor)??""))return;const snapshot=actual.source.getSnapshot();requireBuilderEditor(handle);const next=actual.nextPageKey?.(latest.page.request);requireBuilderEditor(handle);current.store.option(current.actor,entry.id);if(next!==undefined&&next!==null&&actual.source.getSnapshot()===snapshot)criteriaRequestOptions(handle,latest.page.request.term,next);})}>{e.messages.nextOptions}</Button>:null}
    </div>;requireBuilderEditor(handle);if(port)e.store.option(e.actor,entry.id);return node;
  }catch{return <p role="status">{builderUnavailable}</p>;}
}
