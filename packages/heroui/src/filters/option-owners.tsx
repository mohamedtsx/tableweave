"use client";

import type { ResourceContext } from "@tableweave/react";
import type { QuerySchema, ScalarId } from "@tableweave/react/contracts";
import type { OptionSourceView } from "@tableweave/react/filters";
import {
  getBuilderFields,
  projectOptionSourceView,
} from "@tableweave/react/filters";
import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { FilterBuilderProps, FilterOptionPort } from "./types.js";
import type { BuilderConnection,CriteriaBuilderStore,CriteriaBuilderEditorHandle } from "./criteria-builder-host.js";
import { readBuilderEditor,requireBuilderEditor,safely,useCriteriaBuilderVersion } from "./criteria-builder-host.js";
import type { CriteriaActor } from "./criteria-commit.js";
import type { BuilderFieldId,OptionRequest } from "@tableweave/react/filters";

const OptionViews = createContext<
  ReadonlyMap<string, OptionSourceView<ScalarId>>
>(new Map());
export function useBuilderOptionViews() {
  return useContext(OptionViews);
}

export function scalarIds(value: unknown): ScalarId[] {
  if (typeof value === "number" && Number.isFinite(value)) return [value];
  if (typeof value === "string" && value !== "") return [value];
  if (!Array.isArray(value)) return [];
  return value.flatMap((id: unknown) =>
    (typeof id === "string" && id !== "") ||
    (typeof id === "number" && Number.isFinite(id))
      ? [id]
      : [],
  );
}

/** Field-wide accepted membership is a union, not concatenated per-rule IDs. */
export function acceptedOptionIds(
  rules: readonly { readonly field: string; readonly value?: unknown }[],
  fieldId: string,
): ScalarId[] {
  return [
    ...new Set<ScalarId>(
      rules
        .filter((rule) => rule.field === fieldId)
        .flatMap((rule) => scalarIds(rule.value)),
    ),
  ];
}

function OptionOwner({
  fieldId,
  port,
  expected,
  ids,
  invalidationKey,
  children,
}: {
  readonly fieldId: string;
  readonly port: FilterOptionPort;
  readonly expected: ResourceContext;
  readonly ids: readonly ScalarId[];
  readonly invalidationKey: string | number;
  readonly children: ReactNode;
}) {
  const parents = useBuilderOptionViews();
  const source = port.source;
  const raw = useSyncExternalStore<OptionSourceView<ScalarId>>(
    source.subscribe,
    source.getSnapshot,
    source.getServerSnapshot,
  );
  const [epoch, setEpoch] = useState(invalidationKey);
  const { definitionKey, scopeKey, access } = expected;
  const context = useMemo(
    () => ({ definitionKey, scopeKey, access, fieldId }),
    [definitionKey, scopeKey, access, fieldId],
  );
  // This lifetime is outside picker visibility and passive, including StrictMode.
  useEffect(() => source.connect(), [source]);
  const committed = useRef<{
    readonly source: typeof source;
    readonly context: typeof context;
  } | null>(null);
  useEffect(() => {
    const current = source.getSnapshot().context;
    const previous =
      committed.current?.source === source ? committed.current.context : null;
    const restored =
      previous?.access === false &&
      previous.definitionKey === definitionKey &&
      previous.scopeKey === scopeKey &&
      previous.fieldId === fieldId;
    if (
      current.access ||
      !access ||
      current.definitionKey !== definitionKey ||
      current.scopeKey !== scopeKey ||
      current.fieldId !== fieldId ||
      restored
    )
      source.setContext(context);
    committed.current = { source, context };
  }, [source, context, definitionKey, scopeKey, access, fieldId]);
  useEffect(() => {
    if (epoch !== invalidationKey) {
      source.clear("reset");
      setEpoch(invalidationKey);
    }
  }, [source, epoch, invalidationKey]);
  useEffect(() => {
    if (port.idType === "number")
      port.source.setSelectedIds(
        context,
        ids.filter((id): id is number => typeof id === "number"),
      );
    else if (port.idType === "string")
      port.source.setSelectedIds(
        context,
        ids.filter((id): id is string => typeof id === "string"),
      );
    else port.source.setSelectedIds(context, ids);
  }, [port, context, ids]);
  // Pure render masking precedes cleanup. An unchanged allowed prop cannot
  // restore a terminal failure; restoration needs an explicit prop transition.
  const projected = projectOptionSourceView<ScalarId>(
    raw,
    epoch === invalidationKey ? context : { ...context, access: false },
    ids,
  );
  const views = new Map(parents);
  views.set(fieldId, projected);
  return <OptionViews.Provider value={views}>{children}</OptionViews.Provider>;
}

export function OptionOwners<S extends QuerySchema>({
  props,
  rules,
  children,
}: {
  readonly props: FilterBuilderProps<S>;
  readonly rules: readonly {
    readonly field: string;
    readonly value?: unknown;
  }[];
  readonly children: ReactNode;
}) {
  let result = children;
  for (const entry of [
    ...getBuilderFields(props.controller.getDefinition().schema),
  ].reverse()) {
    const port = props.fields[entry.id]?.asyncOptions;
    if (!port) continue;
    const ids = acceptedOptionIds(rules, entry.id);
    result = (
      <OptionOwner
        key={entry.id}
        fieldId={entry.id}
        port={port}
        expected={props.expectedResourceContext}
        ids={ids}
        invalidationKey={props.invalidationKey}
      >
        {result}
      </OptionOwner>
    );
  }
  return result;
}

/** Connection/subscription lifetimes are exact-source identities outside pickers.
 * React observes opaque metadata versions, never authoritative page/label copies. */
export function CriteriaOptionOwners<S extends QuerySchema>({store}:{readonly store:CriteriaBuilderStore<S>}) {
  const version=useCriteriaBuilderVersion(store),frame=store.read(),actor=frame?.actor;
  useEffect(()=>()=>store.releaseOptions(),[store]);
  useEffect(()=>{void version;if(actor)safely(()=>store.syncOptions(actor));},[store,actor,version]);
  return <>{store.connections().map(entry=><CriteriaOptionLifetime key={entry.key} store={store} entry={entry}/>)}</>;
}
function CriteriaOptionLifetime<S extends QuerySchema>({store,entry}:{readonly store:CriteriaBuilderStore<S>;readonly entry:BuilderConnection}) {
  const [versions]=useState(()=>{let version:object={};return {get:()=>version,subscribe:(listener:()=>void)=>entry.source.subscribe(()=>{version={};listener();store.signal();return undefined;})};});
  useSyncExternalStore(versions.subscribe,versions.get,versions.get);
  useEffect(()=>store.connect(entry),[store,entry]);return null;
}
export function criteriaOptionView<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:CriteriaActor<"builder",S>,fieldId:BuilderFieldId<S>):OptionSourceView<ScalarId> {
  const port=store.option(actor,fieldId),frame=store.require(actor),ids=acceptedOptionIds(frame.origin.controller.getSnapshot().query.builder.rules,fieldId);
  store.option(actor,fieldId);const raw=port.source.getSnapshot();store.option(actor,fieldId);
  const projected=projectOptionSourceView<ScalarId>(raw,{...frame.origin.context,fieldId},ids);store.option(actor,fieldId);return projected;
}
export function criteriaRequestOptions(handle:CriteriaBuilderEditorHandle,term:string,pageKey:string):void {
  const e=readBuilderEditor(handle);if(!e.draft)return;const field=e.fields.find(item=>item.id===e.draft?.field);if(!field)return;
  const store=e.store,actor=e.actor,fieldId=field.id,port=store.option(actor,fieldId);requireBuilderEditor(handle);const source=port.source;
  const retry=criteriaTransport(handle);
  const request=source.begin({...e.frame.origin.context,fieldId,term,pageKey,retry});requireBuilderEditor(handle);store.option(actor,fieldId);if(!request)return;
  const token={};e.frame.local.request.write(actor,{token,field:fieldId,request});
  try{const work=retry(request);if(work!==undefined)void Promise.resolve(work).catch(criteriaFailure(handle,token));}catch{criteriaFailure(handle,token)();}
}
function criteriaTransport(handle:CriteriaBuilderEditorHandle){return (request:OptionRequest)=>{const current=readBuilderEditor(handle);if(!current.draft)return;const field=current.fields.find(item=>item.id===current.draft?.field);if(!field)return;const port=current.store.option(current.actor,field.id),version=current.frame.cell.getSnapshot().version;const work=port.onRequest(request);requireBuilderEditor(handle);current.store.option(current.actor,field.id);if(current.frame.cell.getSnapshot().version!==version)throw new Error("Criteria options unavailable");return work;};}
function criteriaFailure(handle:CriteriaBuilderEditorHandle,token:object){return ()=>safely(()=>{const current=readBuilderEditor(handle),saved=current.frame.local.request.read(current.actor);if(saved?.token!==token)return;const field=current.fields.find(item=>item.id===saved.field);if(!field)return;const port=current.store.option(current.actor,field.id);requireBuilderEditor(handle);port.source.fail(saved.request,"unavailable");requireBuilderEditor(handle);current.store.option(current.actor,field.id);});}
export function criteriaChoiceReceipt(handle:CriteriaBuilderEditorHandle):object|null {
  const e=readBuilderEditor(handle);if(!e.draft)return null;const field=e.fields.find(item=>item.id===e.draft?.field);if(!field||!e.frame.ports.fields[field.id]?.asyncOptions)return null;const port=e.store.option(e.actor,field.id),view=criteriaOptionView(e.store,e.actor,field.id),previous=e.frame.local.choiceReceipt.read(e.actor);
  if(e.frame.local.term.read(e.actor)===null)e.frame.local.term.write(e.actor,view.page?.request.term??view.request?.term??"");
  if(previous?.source===port.source&&previous.request===view.request&&previous.page===view.page)return previous.token;
  const token={};e.frame.local.choiceReceipt.write(e.actor,{token,source:port.source,request:view.request,page:view.page});return token;
}
