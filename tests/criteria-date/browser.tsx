import {
  StrictMode,
  Suspense,
  startTransition,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import type { FilterDateProps } from "../../packages/heroui/src/toolbar/filter-date.js";
import { FilterDate } from "../../packages/heroui/src/toolbar/filter-date.js";
import type { S } from "./fixtures.js";
import { fixture } from "./fixtures.js";
import "../filter-tools/toolbar/fixture.css";
import "../../packages/heroui/src/styles.css";

const f = fixture(),
  range = fixture("datetime", "range"),
  legacy = fixture("date");
let candidateReads = 0,
  complete = true,
  resume: (() => void) | null = null,
  pending: Promise<void> = Promise.resolve();
function Gate() {
  if (!complete) throw pending;
  return null;
}
function Forward({ input }: { readonly input: FilterDateProps<S> }) {
  return FilterDate(input);
}
function Form() {
  const [text, setText] = useState("");
  return (
    <label>
      Application form
      <input
        aria-label="Application form"
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
      />
    </label>
  );
}
function App() {
  const [version, update] = useState(0),
    [visible, show] = useState(true),
    [drop, setDrop] = useState(false),
    [, changed] = useState(0);
  useEffect(() => f.app.C.subscribe(() => changed((n) => n + 1)), []);
  const input = f.props({
    onMutation(result) {
      f.observe(result);
      changed((n) => n + 1);
    },
    presets: [],
    messages: { formatTimeZone: (zone) => `Time zone: ${zone}` },
  });
  const supplied = drop
    ? { controller: f.app.C, expectedContext: f.context }
    : input;
  const candidate =
    version === 99
      ? new Proxy(supplied, {
          getOwnPropertyDescriptor(object, key) {
            if (key !== "criteria") candidateReads++;
            return Reflect.getOwnPropertyDescriptor(object, key);
          },
        })
      : supplied;
  return (
    <main
      onKeyDownCapture={(event) => {
        if (!event.altKey) return;
        if (event.key === "r") {
          event.preventDefault();
          update((n) => n + 1);
        }
        if (event.key === "q") {
          event.preventDefault();
          f.external({
            type: "sorting.change",
            update: [{ id: "id", desc: true }],
          });
          update((n) => n + 1);
        }
      }}
    >
      <div className="fixture-controls">
        <button type="button" onClick={() => update((n) => n + 1)}>
          Reconfigure
        </button>
        <button type="button" onClick={() => show((value) => !value)}>
          Toggle tools
        </button>
        <button
          type="button"
          onClick={() => {
            f.accept();
            changed((n) => n + 1);
          }}
        >
          Accept date
        </button>
        <button
          type="button"
          onClick={() => {
            f.reject();
            changed((n) => n + 1);
          }}
        >
          Reject date
        </button>
        <button
          type="button"
          onClick={() => {
            f.external({
              type: "date.commit",
              date: {
                operator: "date.on",
                value: { kind: "relative", preset: "today" },
              },
            });
            update((n) => n + 1);
          }}
        >
          External accepted date
        </button>
        <button
          type="button"
          onClick={() => {
            f.external({
              type: "query.context",
              locale: "fr-FR",
              timeZone: "Europe/Paris",
            });
            update((n) => n + 1);
          }}
        >
          Change locale zone
        </button>
        <button
          type="button"
          onClick={() => {
            f.reset();
            update((n) => n + 1);
          }}
        >
          Reset domain
        </button>
        <button type="button" onClick={() => setDrop((value) => !value)}>
          Drop criteria
        </button>
        <button
          type="button"
          onClick={() => {
            complete = false;
            pending = new Promise<void>((done) => {
              resume = done;
            });
            startTransition(() => update(99));
          }}
        >
          Suspend candidate
        </button>
        <button
          type="button"
          onClick={() => {
            complete = true;
            resume?.();
          }}
        >
          Resolve candidate
        </button>
        <button
          type="button"
          onClick={() => {
            complete = true;
            resume?.();
            update(1);
          }}
        >
          Abandon candidate
        </button>
      </div>
      <Form />
      <Suspense fallback={<p>Candidate pending</p>}>
        <Gate />
        {visible ? (
          <section data-testid="single">
            <Forward input={candidate} />
          </section>
        ) : null}
      </Suspense>
      <section data-testid="range">
        <FilterDate {...range.props({ presets: [] })} />
      </section>
      <section data-testid="legacy">
        <FilterDate
          controller={legacy.app.C}
          expectedContext={legacy.context}
          presets={[]}
        />
      </section>
      <output data-testid="observations">{f.observed.length}</output>
      <output data-testid="candidate-reads">{candidateReads}</output>
      <output data-testid="accepted">
        {JSON.stringify(f.app.C.getSnapshot().query.date)}
      </output>
      <output data-testid="disposed">{String(f.app.C.isDisposed())}</output>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Fixture root missing");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
