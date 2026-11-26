import { StrictMode, Suspense, startTransition, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { FilterCustomEditorProps } from "../../packages/heroui/src/filters/types.js";
import type { S } from "./fixtures.js";
import { fixture } from "./fixtures.js";
import { Host } from "./host.js";

const f = fixture(),
  target = f.commit();
let mounts = 0,
  privateCalls = 0,
  descriptorReads = 0;
function Form({ value, onChange }: FilterCustomEditorProps<S>) {
  const identity = useRef(++mounts);
  return (
    <label>
      Fixture raw input
      <input
        data-form={identity.current}
        aria-label="Fixture raw input"
        value={String(value)}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}
const configuration = () =>
  f.builder({
    fields: {
      amount: {
        label: "Amount",
        renderEditor(props) {
          privateCalls++;
          return <Form {...props} />;
        },
      },
    },
  });
let release: (() => void) | null = null;
let resolved = true;
const wait = { current: Promise.resolve() };
function Suspender() {
  if (!resolved) throw wait.current;
  return null;
}
function App() {
  const [revision, revise] = useState(0),
    [visible, show] = useState(true);
  const props =
    revision === 99
      ? new Proxy(configuration(), {
          getOwnPropertyDescriptor(object, key) {
            descriptorReads++;
            return Reflect.getOwnPropertyDescriptor(object, key);
          },
        })
      : configuration();
  return (
    <>
      <button type="button" onClick={() => revise((value) => value + 1)}>
        Reconfigure
      </button>
      <button type="button" onClick={() => show((value) => !value)}>
        Toggle
      </button>
      <button
        type="button"
        onClick={() => {
          resolved = false;
          wait.current = new Promise<void>((resolve) => {
            release = resolve;
          });
          startTransition(() => revise(99));
        }}
      >
        Suspend candidate
      </button>
      <button
        type="button"
        onClick={() => {
          resolved = true;
          release?.();
        }}
      >
        Resolve
      </button>
      <Suspense fallback={<span>Waiting</span>}>
        {visible && (
          <Host controller={f.app.C} target={target} opaqueProps={props} />
        )}
        <Suspender />
      </Suspense>
    </>
  );
}
const container = document.getElementById("root");
if (!container) throw new Error("Missing fixture container");
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
Object.assign(window, {
  criteriaCommitFixture: {
    counts: () => ({
      privateCalls,
      descriptorReads,
      selection: f.app.C.getSnapshot().selection,
      phase: f.app.P.getSnapshot().phase,
    }),
  },
});
