"use client";

import { getCriteriaToolOwner,requireCriteriaTool,requireCriteriaAuthority } from "@tableweave/react";
import type { CriteriaFrameOwner,CriteriaAuthority,CriteriaOrigin,CriteriaPublication,TableCommand } from "@tableweave/react";
import type { QuerySchema,ScalarId,OperatorRegistry,OperatorDescriptor,JsonValue } from "@tableweave/react/contracts";
import { defaultOperatorRegistry,getBuilderFields,getFieldOperators,validateRuleDraft,invertRule,registerOptionCriteriaSource } from "@tableweave/react/filters";
import type { BuilderFieldId, OptionRequest } from "@tableweave/react/filters";
import { useLayoutEffect,useState,useSyncExternalStore } from "react";
import type { ComponentType } from "react";
import { captureCriteriaCandidate } from "../toolbar/criteria-tool-host.js";
import { createCriteriaCommitCell } from "./criteria-commit.js";
import type { CriteriaActor,CriteriaCommitCell,CriteriaCommitted,CriteriaLocalCell,CriteriaMountLease,CriteriaWorkHandle } from "./criteria-commit.js";
import { createCriteriaDateBundle,beginCriteriaDateEdit,closeCriteriaDateEdit,reconcileCriteriaDateBundle,readCriteriaDateToolbar } from "../date/criteria-date-state.js";
import type { CriteriaDateBundle } from "../date/criteria-date-state.js";
import { dateOperandValue } from "./date-value.js";
import { builderMessages } from "./messages.js";
import type { FilterBuilderProps,FilterOptionPort } from "./types.js";
import { acceptedOptionIds } from "./option-owners.js";

type Actor<S extends QuerySchema>=CriteriaActor<"builder",S>;
type Cell<S extends QuerySchema>=CriteriaCommitCell<"builder",S>;
export interface BuilderDraft {readonly token:object;readonly id:string;readonly field:string;readonly operator:string;readonly value:unknown;readonly baseline:string|null;readonly anchor:string;readonly part:"field"|"operator"|"value"|"options";readonly locale:string;readonly timeZone:string;}
interface Focus<S extends QuerySchema>{readonly token:object;readonly anchor:string;readonly actor:Actor<S>|null;readonly work:CriteriaWorkHandle<"builder",S>|null;}
export interface BuilderLocal<S extends QuerySchema>{readonly draft:CriteriaLocalCell<"builder",S,BuilderDraft>;readonly error:CriteriaLocalCell<"builder",S,string>;readonly announcement:CriteriaLocalCell<"builder",S,string>;readonly allocated:CriteriaLocalCell<"builder",S,ReadonlySet<string>>;readonly search:CriteriaLocalCell<"builder",S,string>;readonly numbers:CriteriaLocalCell<"builder",S,readonly string[]>;readonly term:CriteriaLocalCell<"builder",S,string>;readonly choiceNotice:CriteriaLocalCell<"builder",S,string>;readonly dateKey:CriteriaLocalCell<"builder",S,string>;readonly date:CriteriaDateBundle<"builder",S>;readonly focus:CriteriaLocalCell<"builder",S,Focus<S>>;readonly receipt:CriteriaLocalCell<"builder",S,{readonly json:string;readonly token:object}>;readonly choiceReceipt:CriteriaLocalCell<"builder",S,{readonly token:object;readonly source:object;readonly request:object|null;readonly page:object|null}>;readonly request:CriteriaLocalCell<"builder",S,{readonly token:object;readonly field:string;readonly request:import("@tableweave/react/filters").OptionRequest}>;}
export interface BuilderFrame<S extends QuerySchema> extends CriteriaCommitted<"builder",S>{readonly cell:Cell<S>;readonly local:BuilderLocal<S>;readonly owner:CriteriaFrameOwner<S>;readonly className:string;}
interface FieldClaim<S extends QuerySchema>{readonly field:BuilderFieldId<S>;readonly source:FilterOptionPort["source"];readonly publication:CriteriaPublication<S>;readonly criteria:CriteriaAuthority<S>;readonly origin:CriteriaOrigin<S>;readonly release:()=>void;active:boolean;}
export interface BuilderConnection{readonly key:string;readonly source:FilterOptionPort["source"];connected:boolean;stop:(()=>void)|null;}
export interface CriteriaBuilderStore<S extends QuerySchema>{readonly mount:()=>()=>void;readonly commit:(input:unknown)=>void;readonly mode:()=>"legacy"|"adopted"|null;readonly read:()=>BuilderFrame<S>|null;readonly require:(actor:Actor<S>)=>BuilderFrame<S>;readonly subscribe:(listener:()=>void)=>()=>void;readonly snapshot:()=>object;readonly signal:()=>void;readonly connections:()=>readonly BuilderConnection[];readonly connect:(entry:BuilderConnection)=>()=>void;readonly releaseOptions:()=>void;readonly option:(actor:Actor<S>,field:BuilderFieldId<S>)=>FilterOptionPort;readonly syncOptions:(actor:Actor<S>)=>void;}
export class CriteriaBuilderError extends Error{readonly code="criteria.builder.unavailable";constructor(){super("Criteria builder is unavailable.");this.name="CriteriaBuilderError";}}
function deny():never{throw new CriteriaBuilderError();}
function sameOrigin<S extends QuerySchema>(a:CriteriaOrigin<S>,b:CriteriaOrigin<S>){return a.controller===b.controller&&a.definition===b.definition&&a.epoch===b.epoch&&a.context.definitionKey===b.context.definitionKey&&a.context.scopeKey===b.context.scopeKey&&a.context.access===b.context.access;}
function own(input: unknown, key: string, check: () => void, optional = false): unknown {
  if (!input || typeof input !== "object") return deny();
  check();
  let descriptor: PropertyDescriptor | undefined;
  try { descriptor = Object.getOwnPropertyDescriptor(input, key); } finally { check(); }
  if (!descriptor) {
    let inherited: boolean;
    try { inherited = Reflect.has(input, key); } finally { check(); }
    if (inherited || !optional) return deny();
    return undefined;
  }
  if (!Object.hasOwn(descriptor, "value")) return deny();
  return descriptor.value;
}
function captureValue(input: unknown, check: () => void): unknown {
  const active = new WeakSet<object>(), copies = new WeakMap<object, unknown>();
  const reflect = <V,>(read: () => V): V => {
    check();
    try { return read(); } finally { check(); }
  };
  const copy = (value: unknown): unknown => {
    check();
    if (value === undefined || value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value;
    if (!value || typeof value !== "object" || active.has(value)) return deny();
    if (copies.has(value)) return copies.get(value);
    const array = reflect(() => Array.isArray(value)), prototype = reflect(() => Object.getPrototypeOf(value));
    if (!array && prototype !== null && prototype !== Object.prototype) return deny();
    const keys = reflect(() => Reflect.ownKeys(value));
    if (keys.some(key => typeof key !== "string")) return deny();
    const names = keys.filter(key => key !== "length" || !array);
    if (array) {
      const length = reflect(() => Object.getOwnPropertyDescriptor(value, "length"));
      if (!length || !Object.hasOwn(length, "value") || names.length !== length.value || names.some((key, index) => key !== String(index))) return deny();
    }
    active.add(value);
    const result: unknown[] | Record<string, unknown> = array ? [] : Object.create(null);
    for (const key of names) {
      const descriptor = reflect(() => Object.getOwnPropertyDescriptor(value, key));
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return deny();
      const copied = copy(descriptor.value);
      Object.defineProperty(result, key, { value: copied, enumerable: true, configurable: true, writable: true });
    }
    active.delete(value);
    const frozen = Object.freeze(result);
    copies.set(value, frozen);
    return frozen;
  };
  const result = copy(input);
  check();
  return result;
}
export function safely(action:()=>void):void {try{action();}catch{/* Denial has no raw payload logging or latest-handler fallback. */}}
function allocate<S extends QuerySchema>(cell:Cell<S>):BuilderLocal<S>{return Object.freeze({draft:cell.createLocal<BuilderDraft>("draft"),error:cell.createLocal("notice"),announcement:cell.createLocal("notice"),allocated:cell.createLocal<ReadonlySet<string>>("session"),search:cell.createLocal("text"),numbers:cell.createLocal<readonly string[]>("draft"),term:cell.createLocal("text"),choiceNotice:cell.createLocal("notice"),dateKey:cell.createLocal<string>("session"),date:createCriteriaDateBundle(cell),focus:cell.createLocal<Focus<S>>("session"),receipt:cell.createLocal<{readonly json:string;readonly token:object}>("receipt"),choiceReceipt:cell.createLocal<{readonly token:object;readonly source:object;readonly request:object|null;readonly page:object|null}>("receipt"),request:cell.createLocal<{readonly token:object;readonly field:string;readonly request:OptionRequest}>("receipt")});}

export function createCriteriaBuilderStore<S extends QuerySchema>():CriteriaBuilderStore<S>{
  let version:object={},mode:"legacy"|"adopted"|null=null,mount:object|null=null,operation:object={},busy=false,notifying=false,cell:Cell<S>|null=null,lease:CriteriaMountLease<"builder",S>|null=null,local:BuilderLocal<S>|null=null,owner:CriteriaFrameOwner<S>|null=null,presentation:CriteriaLocalCell<"builder",S,{readonly actor:Actor<S>;readonly className:string}>|null=null;
  let stopC:(()=>void)|null=null,stopCell:(()=>void)|null=null,counter=0;
  const listeners=new Set<()=>void>(),claims=new Map<string,FieldClaim<S>>(),connections=new Map<object,BuilderConnection>();
  const signal=()=>{if(busy)return;version={};if(notifying)return;notifying=true;try{for(const listener of [...listeners])try{listener();}catch{/* Metadata-only notification. */}}finally{notifying=false;}};
  const requireActor=(actor:Actor<S>):BuilderFrame<S>=>{if(!mount||!cell||!local||!owner||!presentation||mode!=="adopted")return deny();const committed=cell.require(actor),data=presentation.read(actor);if(!data||data.actor!==actor)return deny();return Object.freeze({...committed,cell,local,owner,className:data.className});};
  const read=()=>{try{const actor=cell?.getSnapshot().actor;return actor?requireActor(actor):null;}catch{return null;}};
  const retire=()=>{if(cell&&lease&&owner&&targetAuthority){try{cell.commit(lease,{owner,authority:targetAuthority},Object.freeze({}));}catch{/* Failed capture is the actual F3 empty sentinel. */}}};
  let targetAuthority:ReturnType<typeof captureCriteriaCandidate<S>> extends never?never:Parameters<Cell<S>["commit"]>[1]["authority"]|null=null;
  const stopConnection=(entry:BuilderConnection)=>{const stop=entry.stop;entry.stop=null;entry.connected=false;if(stop)try{stop();}catch{/* Actual source/F2 lifecycle retains refusal/debt. */}};
  const releaseClaim=(claim:FieldClaim<S>)=>{if(!claim.active)return;claim.active=false;try{claim.release();}catch{/* No void-return acknowledgement inference. */}};
  const reconcileClaims=(actor:Actor<S>)=>{
    const frame=requireActor(actor),wanted=new Set<object>();let changed=false;
    for(const entry of getBuilderFields(frame.origin.definition.schema)){
      frame.cell.require(actor);
      const port=frame.ports.fields[entry.id]?.asyncOptions,previous=claims.get(entry.id);
      if(port)wanted.add(port.source);
      if(previous&&(!port||previous.source!==port.source||previous.publication!==frame.owner.publication||!sameOrigin(previous.origin,frame.origin)))releaseClaim(previous);
      if(!port)continue;
      if(previous?.active&&previous.source===port.source&&previous.publication===frame.owner.publication&&sameOrigin(previous.origin,frame.origin)){try{requireCriteriaAuthority(previous.criteria,previous.origin);continue;}catch{releaseClaim(previous);}}
      let release:(()=>void)|null=null;try{
        frame.cell.require(actor);const publication=frame.owner.publication,criteria=publication.issue(frame.origin);frame.cell.require(actor);
        release=port.idType==="number"?registerOptionCriteriaSource<S,number>({publication,criteria,fieldId:entry.id,source:port.source}):port.idType==="string"?registerOptionCriteriaSource<S,string>({publication,criteria,fieldId:entry.id,source:port.source}):registerOptionCriteriaSource<S,ScalarId>({publication,criteria,fieldId:entry.id,source:port.source});frame.cell.require(actor);requireCriteriaAuthority(criteria,frame.origin);
        claims.set(entry.id,{field:entry.id,source:port.source,publication,criteria,origin:frame.origin,release,active:true});
        const connection=connections.get(port.source);if(!connection||(!connection.connected&&!connection.stop)){connections.set(port.source,{key:connection?.key??`source-${++counter}`,source:port.source,connected:false,stop:null});changed=true;}
      }catch{if(release)try{release();}catch{/* Actual publication retains owed debt. */}/* Unknown/dirty/mismatched source stays opaque until real owner reset. */}
    }
    for(const [source,entry] of connections)if(!wanted.has(source)){stopConnection(entry);connections.delete(source);changed=true;}
    if(changed)signal();
  };
  const option=(actor:Actor<S>,field:BuilderFieldId<S>):FilterOptionPort=>{
    const frame=requireActor(actor),port=frame.ports.fields[field]?.asyncOptions,claim=claims.get(field);if(!port||!claim?.active||claim.source!==port.source||claim.publication!==frame.owner.publication||!sameOrigin(claim.origin,frame.origin))return deny();
    requireCriteriaAuthority(claim.criteria,claim.origin);frame.cell.require(actor);
    const raw=port.source.getSnapshot();requireCriteriaAuthority(claim.criteria,claim.origin);frame.cell.require(actor);
    if(raw.invalidationFailed||!raw.context.access||raw.context.definitionKey!==frame.origin.context.definitionKey||raw.context.scopeKey!==frame.origin.context.scopeKey||raw.context.fieldId!==field||!connections.get(port.source)?.connected)return deny();return port;
  };
  const store:CriteriaBuilderStore<S>=Object.freeze({mode:()=>mode,read,require:requireActor,signal,snapshot:()=>version,subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},connections:()=>[...connections.values()],
    connect(entry:BuilderConnection){if(connections.get(entry.source)!==entry||entry.connected)return()=>{};const frame=read();if(!frame)return()=>{};const claim=[...claims.values()].find(item=>item.active&&item.source===entry.source&&sameOrigin(item.origin,frame.origin));if(!claim)return()=>{};let acquired:(()=>void)|null=null;try{requireCriteriaAuthority(claim.criteria,claim.origin);frame.cell.require(frame.actor);acquired=entry.source.connect();frame.cell.require(frame.actor);entry.stop=acquired;entry.connected=true;signal();}catch{if(acquired)try{acquired();}catch{/* Real source cleanup, not a void acknowledgement. */}}return()=>stopConnection(entry);},option,
    releaseOptions(){for(const entry of connections.values())stopConnection(entry);for(const claim of claims.values())releaseClaim(claim);},
    syncOptions(actor:Actor<S>){reconcileClaims(actor);const frame=requireActor(actor);for(const entry of getBuilderFields(frame.origin.definition.schema)){frame.cell.require(actor);if(!frame.ports.fields[entry.id]?.asyncOptions)continue;try{const port=option(actor,entry.id),state=frame.origin.controller.getSnapshot(),ids=acceptedOptionIds(state.query.builder.rules,entry.id),context={...frame.origin.context,fieldId:entry.id};option(actor,entry.id);if(port.idType==="number")port.source.setSelectedIds(context,ids.filter((id):id is number=>typeof id==="number"));else if(port.idType==="string")port.source.setSelectedIds(context,ids.filter((id):id is string=>typeof id==="string"));else port.source.setSelectedIds(context,ids);option(actor,entry.id);}catch{/* No stale passive ID synchronization. */}}},
    mount(){if(mount)return deny();const token={};mount=token;if(cell)lease=cell.connect();return()=>{if(mount!==token)return;mount=null;operation={};stopC?.();stopC=null;if(cell&&lease)cell.disconnect(lease);lease=null;signal();};},
    commit(input:unknown){if(!mount)return deny();if(busy||notifying){operation={};retire();return;}const token={};operation=token;busy=true;try{
      const candidate=captureCriteriaCandidate<S>(input);if(candidate.kind==="omitted"&&mode!=="adopted"){mode="legacy";return;}if(candidate.kind!=="target"||mode==="legacy"){retire();return;}
      const target=candidate.target;if(getCriteriaToolOwner(target.authority)!==target.owner||(owner&&target.owner!==owner))return deny();const origin=requireCriteriaTool(target.authority,target.owner);
      const check=()=>{if(operation!==token||!mount||getCriteriaToolOwner(target.authority)!==target.owner)return deny();requireCriteriaTool(target.authority,target.owner);};check();
      const className=own(input,"className",check,true);check();if(className!==undefined&&typeof className!=="string")return deny();
      if(!cell){cell=createCriteriaCommitCell("builder",origin.controller);local=allocate(cell);presentation=cell.createLocal("session");lease=cell.connect();stopCell=cell.subscribe(signal);}
      if(!lease||!presentation||!local)return deny();targetAuthority=target.authority;const actor=cell.commit(lease,target,input);check();presentation.write(actor,{actor,className:className??""});check();owner=target.owner;mode="adopted";stopC??=origin.controller.subscribe(signal);
      reconcileBuilder(store,actor);check();
    }catch{retire();}finally{busy=false;signal();}},
  });
  void stopCell;return store;
}

declare const editorBrand:unique symbol;
export interface CriteriaBuilderEditorHandle{readonly [editorBrand]:true;}
const handles=new WeakMap<object,{readonly store:CriteriaBuilderStore<QuerySchema>;readonly actor:Actor<QuerySchema>;readonly token:object}>();
export function builderEditor<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>):CriteriaBuilderEditorHandle {const {draft}=builderState(store,actor);if(!draft)return deny();const handle=Object.freeze({}) as CriteriaBuilderEditorHandle;handles.set(handle,{store:store as unknown as CriteriaBuilderStore<QuerySchema>,actor:actor as unknown as Actor<QuerySchema>,token:draft.token});return handle;}
function handleEntry(handle:CriteriaBuilderEditorHandle){const entry=handles.get(handle);if(!entry)return deny();const current=builderState(entry.store,entry.actor);if(!current.draft||current.draft.token!==entry.token)return deny();return {...entry,...current};}
export function useBuilderEditorVersion(handle:CriteriaBuilderEditorHandle){const entry=handles.get(handle);const [empty]=useState(()=>({}));return useSyncExternalStore(entry?.store.subscribe??(()=>()=>{}),entry?.store.snapshot??(()=>empty),entry?.store.snapshot??(()=>empty));}
export function requireBuilderEditor(handle:CriteriaBuilderEditorHandle){handleEntry(handle);}
export function useBuilderEditorRoute(input:unknown):"legacy"|"denied"|CriteriaBuilderEditorHandle {
  const [pin]=useState<{mode:"legacy"|"adopted"|null}>({mode:null}),[ready,setReady]=useState(false);
  let route:"legacy"|"denied"|CriteriaBuilderEditorHandle="denied";
  try{if(input&&typeof input==="object"){const d=Object.getOwnPropertyDescriptor(input,"criteriaEditor");if(!d)route=Reflect.has(input,"criteriaEditor")?"denied":"legacy";else if(Object.hasOwn(d,"value")&&d.value&&typeof d.value==="object"&&handles.has(d.value))route=d.value;}}catch{/* Denied metadata. */}
  useLayoutEffect(()=>{if(route==="legacy"&&pin.mode!=="adopted"){pin.mode="legacy";return;}if(route==="legacy"||route==="denied"||pin.mode==="legacy"){setReady(false);return;}try{requireBuilderEditor(route);pin.mode="adopted";setReady(true);}catch{setReady(false);}});
  if(route==="legacy"&&pin.mode!=="adopted")return "legacy";if(route==="legacy"||route==="denied"||pin.mode==="legacy"||!ready)return "denied";return route;
}
export function readBuilderEditor(handle:CriteriaBuilderEditorHandle){return handleEntry(handle);}
export function useCriteriaBuilderVersion<S extends QuerySchema>(store:CriteriaBuilderStore<S>){return useSyncExternalStore(store.subscribe,store.snapshot,store.snapshot);}
export function builderState<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>){
  const frame=store.require(actor),controller=frame.origin.controller;frame.cell.require(actor);const state=controller.getSnapshot(),schema=frame.origin.definition.schema,messages=Object.freeze({...builderMessages,...frame.ports.messages});
  const saved=frame.local.draft.read(actor);let draft=saved;
  if(draft){const id=draft.id,rule=state.query.builder.rules.find(item=>item.id===id);if(draft.locale!==state.query.locale||draft.timeZone!==state.query.timeZone||(draft.baseline===null?rule!==undefined:!rule||JSON.stringify(rule)!==draft.baseline))draft=null;}
  if(draft&&frame.local.dateKey.read(actor)){const value=readCriteriaDateToolbar(frame.local.date,actor).draft;draft={...draft,value:value.status==="complete"?value.value:value.status==="invalid"?null:undefined};}
  frame.cell.require(actor);return {frame,state,schema,messages,draft,fields:getBuilderFields(schema)};
}
function guard<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>,basis?:BuilderDraft|null){const value=builderState(store,actor);if(basis&&(!value.draft||value.draft.token!==basis.token))return deny();return value;}
function resetEditors<S extends QuerySchema>(frame:BuilderFrame<S>){const {local,actor}=frame;local.search.clear(actor);local.numbers.clear(actor);local.term.clear(actor);local.choiceNotice.clear(actor);local.choiceReceipt.clear(actor);local.request.clear(actor);local.dateKey.clear(actor);closeCriteriaDateEdit(local.date,actor);}
export function reconcileBuilder<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>){
  const current=builderState(store,actor),{frame,draft}=current;
  if(frame.local.draft.read(actor)&&!draft){frame.local.draft.clear(actor);resetEditors(frame);}
  reconcileCriteriaDateBundle(frame.local.date,actor);
  const json=JSON.stringify(current.state.query.builder),receipt=frame.local.receipt.read(actor);if(!receipt||receipt.json!==json)frame.local.receipt.write(actor,{json,token:{}});
  if(draft?.part!=="value")return;
  const entry=current.fields.find(item=>item.id===draft.field),descriptor=entry?getFieldOperators(current.schema,entry.id,frame.ports.registry??defaultOperatorRegistry).find(item=>item.id===draft.operator):undefined;
  if(!entry||!descriptor)return;
  if(entry.field.type==="number"&&!frame.local.numbers.read(actor))frame.local.numbers.write(actor,descriptor.cardinality==="range"?[0,1].map(index=>Array.isArray(draft.value)&&typeof draft.value[index]==="number"?String(draft.value[index]):""):[typeof draft.value==="number"?String(draft.value):""]);
  if((entry.field.type==="date"||entry.field.type==="datetime")&&(descriptor.cardinality==="one"||descriptor.cardinality==="range")&&!frame.ports.fields[entry.id]?.renderEditor&&descriptor.builtin){
    const key=JSON.stringify([draft.id,draft.field,draft.operator,draft.baseline]);if(frame.local.dateKey.read(actor)!==key){const seed=dateOperandValue(draft.value)??null;beginCriteriaDateEdit(frame.local.date,actor,{kind:"builder",fieldId:entry.id,operator:descriptor.id,ruleId:draft.baseline===null?null:draft.id,draft:{id:draft.id,baseline:draft.baseline,value:seed}});guard(store,actor,draft);frame.local.dateKey.write(actor,key);}
  }else if(frame.local.dateKey.read(actor)){frame.local.draft.write(actor,{...draft});frame.local.dateKey.clear(actor);closeCriteriaDateEdit(frame.local.date,actor);}
}
export function builderRegistry<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>,basis?:BuilderDraft|null):OperatorRegistry {
  const initial=guard(store,actor,basis),editor=basis!==undefined&&basis!==null,field=basis?.field,token=basis?.token??initial.frame.local.receipt.read(actor)?.token??deny(),cell=initial.frame.cell,source=initial.frame.ports.registry??defaultOperatorRegistry;
  // Retained wrappers carry only actual actor/cell/receipt identities. Accepted
  // JSON and draft values are reread from their genuine F3 slots, never backed up.
  const check=()=>{const current=guard(store,actor);if(editor){if(current.draft?.token!==token)return deny();if(field&&current.frame.ports.fields[field as BuilderFieldId<S>]?.asyncOptions)store.option(actor,field as BuilderFieldId<S>);}else{const receipt=current.frame.local.receipt.read(actor);if(receipt?.token!==token||receipt.json!==JSON.stringify(current.state.query.builder))return deny();}};
  const invoke=<V,>(fn:()=>V):V=>{check();const version=cell.getSnapshot().version;try{return fn();}finally{check();if(cell.getSnapshot().version!==version)deny();}};
  const wrap=(descriptor:OperatorDescriptor):OperatorDescriptor=>{if(!descriptor.custom)return descriptor;const original=descriptor.custom,normalize=original.normalize,evaluate=original.evaluate;return {...descriptor,custom:{...original,validate(value):value is JsonValue{return invoke(()=>original.validate(value));},...(normalize?{normalize:(value:JsonValue)=>invoke(()=>normalize.call(original,value))}:{}),...(evaluate?{evaluate:(...args:Parameters<typeof evaluate>)=>invoke(()=>evaluate.call(original,...args))}:{})}};};
  return {custom:source.custom,descriptors:source.descriptors.map(wrap),get(id){const result=invoke(()=>source.get(id));return result?wrap(result):undefined;}};
}
export function validateBuilder<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>,candidate:BuilderDraft){const value=guard(store,actor,candidate);if(value.frame.ports.fields[candidate.field as BuilderFieldId<S>]?.asyncOptions)try{store.option(actor,candidate.field as BuilderFieldId<S>);}catch{guard(store,actor,candidate);return {status:"incomplete" as const,issues:[{code:"rule.value" as const}]};}const registry=builderRegistry(store,actor,candidate),version=value.frame.cell.getSnapshot().version;const checked=validateRuleDraft(value.schema,value.state.query,{id:candidate.id,field:candidate.field,operator:candidate.operator,...(candidate.value===undefined?{}:{value:candidate.value})},{now:value.state.evaluatedAt,registry,...(candidate.baseline===null?{}:{replaceRuleId:candidate.id})});guard(store,actor,candidate);if(value.frame.cell.getSnapshot().version!==version)return deny();return checked;}
function focusPlan<S extends QuerySchema>(frame:BuilderFrame<S>,anchor:string){const prior=frame.local.focus.read(frame.actor);if(prior?.work)frame.cell.cancelWork(frame.actor,prior.work);frame.local.focus.write(frame.actor,{token:{},anchor,actor:null,work:null});}
function close<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>,anchor?:string){const {frame,draft}=guard(store,actor);frame.local.draft.clear(actor);resetEditors(frame);frame.local.error.clear(actor);focusPlan(frame,anchor??draft?.anchor??"filters");}
function nextId<S extends QuerySchema>(store: CriteriaBuilderStore<S>, actor: Actor<S>, basis?: BuilderDraft | null): string | null {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { frame, state } = guard(store, actor, basis), version = frame.cell.getSnapshot().version;
    let id: unknown;
    try { id = frame.ports.createRuleId ? frame.ports.createRuleId() : `tw-${crypto.randomUUID()}`; }
    catch { /* Only a fresh actor may report the fixed local failure below. */ }
    const latest = guard(store, actor, basis);
    if (frame.cell.getSnapshot().version !== version || latest.state.query.locale !== state.query.locale || latest.state.query.timeZone !== state.query.timeZone || (!basis && JSON.stringify(latest.state.query.builder) !== JSON.stringify(state.query.builder))) return deny();
    const used = frame.local.allocated.read(actor) ?? new Set<string>();
    if (typeof id === "string" && id && !used.has(id) && !latest.state.query.builder.rules.some(rule => rule.id === id)) {
      frame.local.allocated.write(actor, new Set([...used, id]));
      return id;
    }
  }
  const { frame, messages } = guard(store, actor, basis);
  frame.local.error.write(actor, messages.mutationFailed);
  return null;
}
function dispatch<S extends QuerySchema>(store: CriteriaBuilderStore<S>, actor: Actor<S>, command: TableCommand<S>, basis: BuilderDraft | null, message: string) {
  const { frame, state, messages } = guard(store, actor, basis);
  const session = frame.local.draft.read(actor)?.token ?? null;
  if (!basis && frame.local.receipt.read(actor)?.json !== JSON.stringify(state.query.builder)) return deny();
  if (command.type === "builder.commit") {
    const descriptor = builderRegistry(store, actor, basis).get(command.rule.operator);
    if (!descriptor || (frame.ports.evaluationMode === "client" && !descriptor.builtin && typeof descriptor.custom?.evaluate !== "function")) return deny();
  }
  guard(store, actor, basis);
  const version = frame.cell.getSnapshot().version;
  const current = () => {
    store.require(actor);
    if (frame.cell.getSnapshot().version !== version) return deny();
  };
  const result = frame.origin.controller.dispatch(command);
  current();
  let mutationFailed = false;
  try { frame.ports.onMutation?.(result, command); }
  catch { mutationFailed = true; }
  current();
  const sameSession = (frame.local.draft.read(actor)?.token ?? null) === session;
  if (sameSession && (mutationFailed || result.status === "rejected")) frame.local.error.write(actor, messages.mutationFailed);
  if (result.status === "rejected") return null;
  if (sameSession) frame.local.announcement.write(actor, result.status === "proposed" ? messages.submitted : message);
  return result;
}
function receiptGuard<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>,token:object){const current=guard(store,actor),receipt=current.frame.local.receipt.read(actor);if(receipt?.token!==token||receipt.json!==JSON.stringify(current.state.query.builder))return deny();return current;}
export const builderActions=Object.freeze({
  open<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>,anchor:string,part:BuilderDraft["part"],receipt:object,ruleId?:string){const {frame,state}=receiptGuard(store,actor,receipt),rule=ruleId?state.query.builder.rules.find(item=>item.id===ruleId):undefined;if(ruleId&&!rule)return deny();const id=rule?.id??nextId(store,actor);if(!id)return;receiptGuard(store,actor,receipt);const focus=frame.local.focus.read(actor);if(focus?.work)frame.cell.cancelWork(actor,focus.work);frame.local.focus.clear(actor);resetEditors(frame);frame.local.error.clear(actor);frame.local.draft.write(actor,{token:{},id,field:rule?.field??"",operator:rule?.operator??"",value:rule?.value,baseline:rule?JSON.stringify(rule):null,anchor,part,locale:state.query.locale,timeZone:state.query.timeZone});reconcileBuilder(store,actor);},
  cancel<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>){close(store,actor);},
  clear<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>,receipt:object){const {frame,messages}=receiptGuard(store,actor,receipt),token=frame.local.draft.read(actor)?.token??null;if(dispatch(store,actor,{type:"builder.clear"},null,messages.cleared)&&(frame.local.draft.read(actor)?.token??null)===token)close(store,actor,"filters");},
  join<S extends QuerySchema>(store:CriteriaBuilderStore<S>,actor:Actor<S>,join:"and"|"or",receipt:object){const {messages}=receiptGuard(store,actor,receipt);dispatch(store,actor,{type:"builder.join",join},null,messages.applied);},
});
export const editorActions=Object.freeze({
  cancel(handle:CriteriaBuilderEditorHandle){const e=handleEntry(handle);close(e.store,e.actor,e.draft?.anchor);},
  search(handle:CriteriaBuilderEditorHandle,text:string){const e=handleEntry(handle);e.frame.local.search.write(e.actor,text);},
  field(handle:CriteriaBuilderEditorHandle,id:string){const e=handleEntry(handle),entry=e.fields.find(item=>item.id===id);if(!entry||!e.draft)return deny();const operator=getFieldOperators(e.schema,entry.id,builderRegistry(e.store,e.actor,e.draft))[0],candidate={...e.draft,field:id,operator:operator?.id??"",part:"operator" as const};const valid=validateBuilder(e.store,e.actor,candidate).status==="valid"&&operator?.cardinality!=="none";guard(e.store,e.actor,e.draft);resetEditors(e.frame);e.frame.local.draft.write(e.actor,{...candidate,token:{},value:valid?candidate.value:undefined});e.frame.local.error.clear(e.actor);},
  operator(handle:CriteriaBuilderEditorHandle,id:string){const e=handleEntry(handle);if(!e.draft)return deny();const entry=e.fields.find(item=>item.id===e.draft?.field),descriptor=entry?getFieldOperators(e.schema,entry.id,builderRegistry(e.store,e.actor,e.draft)).find(item=>item.id===id):undefined;if(!descriptor)return deny();let candidate={...e.draft,operator:id,part:"value" as const,value:descriptor.cardinality==="none"?undefined:e.draft.value};if(descriptor.cardinality!=="none"&&validateBuilder(e.store,e.actor,candidate).status!=="valid")candidate={...candidate,value:undefined};guard(e.store,e.actor,e.draft);resetEditors(e.frame);e.frame.local.draft.write(e.actor,{...candidate,token:{}});e.frame.local.error.clear(e.actor);reconcileBuilder(e.store,e.actor);if(descriptor.cardinality==="none")editorActions.apply(builderEditor(e.store,e.actor));},
  change(handle:CriteriaBuilderEditorHandle,value:unknown){const e=handleEntry(handle);if(!e.draft)return deny();const version=e.frame.cell.getSnapshot().version,check=()=>{requireBuilderEditor(handle);if(e.frame.cell.getSnapshot().version!==version)deny();};const copied=captureValue(value,check);check();e.frame.local.draft.write(e.actor,{...e.draft,value:copied});e.frame.local.error.clear(e.actor);},
  number(handle:CriteriaBuilderEditorHandle,index:number,text:string){const e=handleEntry(handle),texts=e.frame.local.numbers.read(e.actor);if(!texts||index<0||index>=texts.length)return deny();const next=texts.map((old,i)=>i===index?text:old),parse=(raw:string):unknown=>{const t=raw.trim();if(!t)return undefined;if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(t))return raw;const number=Number(t);return Number.isFinite(number)?number:raw;};e.frame.local.numbers.write(e.actor,next);editorActions.change(handle,next.length===2?next.map(parse):parse(text));},
  apply(handle:CriteriaBuilderEditorHandle,value?:unknown,immediate=false){const e=handleEntry(handle);if(!e.draft)return deny();const candidate=value===undefined?e.draft:{...e.draft,value},checked=validateBuilder(e.store,e.actor,candidate);if(checked.status!=="valid"){e.frame.local.error.write(e.actor,checked.status==="incomplete"?e.messages.incomplete:e.messages.invalid);return;}e.frame.local.error.clear(e.actor);const result=dispatch(e.store,e.actor,{type:"builder.commit",rule:checked.rule},e.draft,e.messages.applied);if(!result)return;if(immediate){if(result.status==="committed"){const committed=result.transition.state.query.builder.rules.find(rule=>rule.id===candidate.id);const current=e.frame.local.draft.read(e.actor);if(committed&&current?.token===candidate.token)e.frame.local.draft.write(e.actor,{...candidate,value:committed.value,baseline:JSON.stringify(committed),part:"value"});}}else {const current=e.frame.local.draft.read(e.actor);if(current?.token===candidate.token)close(e.store,e.actor,candidate.baseline===null?"filters":`${candidate.id}:value`);}},
  remove(handle:CriteriaBuilderEditorHandle){const e=handleEntry(handle);if(!e.draft)return deny();const index=e.state.query.builder.rules.findIndex(rule=>rule.id===e.draft?.id),neighbor=e.state.query.builder.rules[index+1]??e.state.query.builder.rules[index-1];if(dispatch(e.store,e.actor,{type:"builder.remove",ruleId:e.draft.id},e.draft,e.messages.removed)&&e.frame.local.draft.read(e.actor)?.token===e.draft.token)close(e.store,e.actor,neighbor?`${neighbor.id}:field`:"filters");},
  duplicate(handle:CriteriaBuilderEditorHandle){const e=handleEntry(handle);if(!e.draft||e.draft.baseline===null)return deny();const id=nextId(e.store,e.actor,e.draft);if(id&&dispatch(e.store,e.actor,{type:"builder.duplicate",ruleId:e.draft.id,newRuleId:id},e.draft,e.messages.applied)&&e.frame.local.draft.read(e.actor)?.token===e.draft.token)close(e.store,e.actor,`${e.draft.id}:options`);},
  negate(handle:CriteriaBuilderEditorHandle){const e=handleEntry(handle);if(!e.draft)return deny();const rule=e.state.query.builder.rules.find(item=>item.id===e.draft?.id),entry=e.fields.find(item=>item.id===rule?.field);if(!rule||!entry)return deny();const registry=builderRegistry(e.store,e.actor,e.draft),descriptor=registry.get(rule.operator),inverse=getFieldOperators(e.schema,entry.id,registry).find(item=>item.id===descriptor?.inverse&&(e.frame.ports.evaluationMode==="server"||item.builtin||typeof item.custom?.evaluate==="function"));if(!inverse)return;try{const inverted=invertRule(e.schema,rule,{locale:e.state.query.locale,timeZone:e.state.query.timeZone,registry});guard(e.store,e.actor,e.draft);const candidate={...e.draft,operator:inverted.operator,value:inverted.value};const checked=validateBuilder(e.store,e.actor,candidate);if(checked.status==="valid"){if(dispatch(e.store,e.actor,{type:"builder.commit",rule:checked.rule},e.draft,e.messages.applied))close(e.store,e.actor,`${rule.id}:operator`);return;}}catch{guard(e.store,e.actor,e.draft);}resetEditors(e.frame);e.frame.local.draft.write(e.actor,{...e.draft,token:{},operator:inverse.id,value:undefined,part:"value"});reconcileBuilder(e.store,e.actor);},
});

export function CriteriaBuilderHost<S extends QuerySchema>({input,Legacy,Surface}:{readonly input:FilterBuilderProps<S>;readonly Legacy:ComponentType<FilterBuilderProps<S>>;readonly Surface:ComponentType<{readonly store:CriteriaBuilderStore<S>}>}){const [store]=useState(()=>createCriteriaBuilderStore<S>()),candidate=captureCriteriaCandidate<S>(input);useLayoutEffect(()=>store.mount(),[store]);useLayoutEffect(()=>{store.commit(input);});return <BuilderRoute store={store} candidate={candidate.kind} input={input} Legacy={Legacy} Surface={Surface}/>;}
function BuilderRoute<S extends QuerySchema>({store,candidate,input,Legacy,Surface}:{readonly store:CriteriaBuilderStore<S>;readonly candidate:string;readonly input:FilterBuilderProps<S>;readonly Legacy:ComponentType<FilterBuilderProps<S>>;readonly Surface:ComponentType<{readonly store:CriteriaBuilderStore<S>}>}){useCriteriaBuilderVersion(store);if(candidate==="omitted"&&store.mode()!=="adopted")return <Legacy {...input}/>;if(candidate!=="target"||store.mode()==="legacy")return <div role="status">{builderMessages.accessUnavailable}</div>;return <Surface store={store}/>;}
