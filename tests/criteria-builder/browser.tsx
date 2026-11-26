import { StrictMode, Suspense, startTransition, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { FilterBuilder } from "../../packages/heroui/src/filters/filter-builder.js";
import type { FilterBuilderProps, FilterCustomEditorProps } from "../../packages/heroui/src/filters/types.js";
import { fixture, numberRule, dateRule, choiceRules } from "./fixtures.js";
import type { S } from "./fixtures.js";
import "../filter-tools/toolbar/fixture.css";
import "../../packages/heroui/src/styles.css";

const f = fixture([numberRule, dateRule, { id: "t1", field: "note", operator: "text.contains", value: "synthetic note" }, ...choiceRules]);
let ready = true, finish: (() => void) | null = null, pending: Promise<void> = Promise.resolve(), candidateReads = 0;
function Gate() { if (!ready) throw pending; return null; }
function Forward({ input }: { readonly input: FilterBuilderProps<S> }) { return FilterBuilder(input); }
function CustomForm({ input }: { readonly input: FilterCustomEditorProps<S> }) {
  return <label>Custom note<input aria-label="Custom note" defaultValue={typeof input.value === "string" ? input.value : ""} onChange={event => input.onChange(event.currentTarget.value)} /></label>;
}
function App() {
  const [version, update] = useState(0), [visible, show] = useState(true), [drop, dropCriteria] = useState(false), [, changed] = useState(0);
  useEffect(() => f.app.C.subscribe(() => changed(n => n + 1)), []);
  const input = f.props({ fields: {
    ...f.props().fields,
    note: { label: "Note", renderEditor: props => <CustomForm input={props} /> },
    status: { label: "Status", asyncOptions: { idType: "string", source: f.source, onRequest(request) {
      f.source.succeed(request, { options: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }, { id: "c", label: "Gamma" }], hasMore: false });
    } } },
  }, onMutation(result) { f.observe(result); changed(n => n + 1); } });
  if (drop) Reflect.deleteProperty(input, "criteria");
  const candidate = version === 99 ? new Proxy(input, { getOwnPropertyDescriptor(target, key) { if (key !== "criteria") candidateReads++; return Reflect.getOwnPropertyDescriptor(target, key); } }) : input;
  return <main onKeyDownCapture={event => {
    if (!event.altKey) return;
    if (event.key === "r") { event.preventDefault(); update(n => n + 1); }
    if (event.key === "q") { event.preventDefault(); f.external({ type: "sorting.change", update: [{ id: "id", desc: true }] }); update(n => n + 1); }
  }}>
    <button type="button" onClick={() => update(n => n + 1)}>Reconfigure</button>
    <button type="button" onClick={() => show(value => !value)}>Toggle Builder</button>
    <button type="button" onClick={() => { f.accept(); changed(n => n + 1); }}>Accept proposal</button>
    <button type="button" onClick={() => { f.reject(); changed(n => n + 1); }}>Reject proposal</button>
    <button type="button" onClick={() => { f.reset(); update(n => n + 1); }}>Reset domain</button>
    <button type="button" onClick={() => { f.sourceFaults.refusal = !f.sourceFaults.refusal; }}>Toggle reset refusal</button>
    <button type="button" onClick={() => dropCriteria(value => !value)}>Drop criteria</button>
    <button type="button" onClick={() => { ready = false; pending = new Promise<void>(resolve => { finish = resolve; }); startTransition(() => update(99)); }}>Suspend candidate</button>
    <button type="button" onClick={() => { ready = true; finish?.(); update(1); }}>Abandon candidate</button>
    <label>Application form<input aria-label="Application form" defaultValue="" /></label>
    <Suspense fallback={<p>Candidate pending</p>}>
      {visible ? <Forward input={candidate} /> : null}<Gate />
    </Suspense>
    <output data-testid="candidate-reads">{candidateReads}</output>
    <output data-testid="observations">{f.observed.length}</output>
    <output data-testid="accepted">{JSON.stringify(f.app.C.getSnapshot().query.builder)}</output>
    <output data-testid="selection">{JSON.stringify(f.app.C.getSnapshot().selection)}</output>
    <output data-testid="disposed">{String(f.app.C.isDisposed())}</output>
  </main>;
}
const root = document.getElementById("root");
if (!root) throw new Error("Fixture root missing");
createRoot(root).render(<StrictMode><App /></StrictMode>);
