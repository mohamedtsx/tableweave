import {
  StrictMode,
  Suspense,
  startTransition,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import type { FilterSearchProps } from "../../packages/heroui/src/toolbar/filter-search.js";
import { FilterSearch } from "../../packages/heroui/src/toolbar/filter-search.js";
import { FilterTabs } from "../../packages/heroui/src/toolbar/filter-tabs.js";
import type { S } from "./fixtures.js";
import { fixture } from "./fixtures.js";
import "../filter-tools/toolbar/fixture.css";
import "../../packages/heroui/src/styles.css";

const f = fixture();
let candidateReads = 0,
  completed = true,
  resolve: (() => void) | null = null;
let pending: Promise<void> = Promise.resolve();
function Gate() {
  if (!completed) throw pending;
  return null;
}
function SearchForward({ input }: { readonly input: FilterSearchProps<S> }) {
  return FilterSearch(input);
}
function Results() {
  const [value, setValue] = useState("");
  return (
    <section data-testid="results">
      <label>
        Custom results form
        <input
          aria-label="Custom results form"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      </label>
    </section>
  );
}
function App() {
  const [version, update] = useState(0),
    [visible, show] = useState(true),
    [drop, setDrop] = useState(false);
  const [automatic, setAutomatic] = useState(false),
    [longLabels, setLongLabels] = useState(false);
  const [, stateChanged] = useState(0);
  useEffect(() => f.app.C.subscribe(() => stateChanged((n) => n + 1)), []);
  const search = f.search({
    onMutation(result) {
      f.observe(result);
      stateChanged((n) => n + 1);
    },
  });
  const tabs = f.tabs({
    activation: automatic ? "automatic" : "manual",
    tabs: {
      all: {
        label: longLabels
          ? "All synthetic transactions across the current domain"
          : "All",
        count: { value: 1, description: "Synthetic total" },
      },
      active: {
        label: longLabels
          ? "Active synthetic transactions across the current domain"
          : "Active",
      },
    },
    children: <Results />,
    onMutation(result) {
      f.observe(result);
      stateChanged((n) => n + 1);
    },
  });
  const maybeSearch = drop
    ? { controller: f.app.C, expectedContext: f.context }
    : search;
  const candidateSearch =
    version === 99
      ? new Proxy(search, {
          getOwnPropertyDescriptor(object, key) {
            if (key !== "criteria") candidateReads++;
            return Reflect.getOwnPropertyDescriptor(object, key);
          },
        })
      : maybeSearch;
  return (
    <main
      onKeyDownCapture={(event) => {
        if (event.altKey && event.key === "r") {
          event.preventDefault();
          update((value) => value + 1);
        }
      }}
    >
      <div className="fixture-controls">
        <button type="button" onClick={() => update((value) => value + 1)}>
          Reconfigure
        </button>
        <button type="button" onClick={() => show((value) => !value)}>
          Toggle tools
        </button>
        <button
          type="button"
          onClick={() => {
            completed = false;
            pending = new Promise<void>((done) => {
              resolve = done;
            });
            startTransition(() => update(99));
          }}
        >
          Suspend candidate
        </button>
        <button
          type="button"
          onClick={() => {
            completed = true;
            resolve?.();
          }}
        >
          Resolve candidate
        </button>
        <button
          type="button"
          onClick={() => {
            f.acceptUI();
            stateChanged((n) => n + 1);
          }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => {
            f.rejectUI();
            stateChanged((n) => n + 1);
          }}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => {
            f.reset();
            stateChanged((n) => n + 1);
          }}
        >
          Reset domain
        </button>
        <button type="button" onClick={() => setDrop(true)}>
          Drop criteria
        </button>
        <button type="button" onClick={() => setAutomatic(true)}>
          Automatic tabs
        </button>
        <button type="button" onClick={() => setLongLabels(true)}>
          Long tabs
        </button>
        <button
          type="button"
          onClick={() => {
            f.external({
              type: "sorting.change",
              update: [{ id: "amount", desc: true }],
            });
            stateChanged((n) => n + 1);
          }}
        >
          Sort
        </button>
      </div>
      <Suspense fallback={<p>Tools waiting</p>}>
        {visible ? (
          <>
            <SearchForward input={candidateSearch} />
            <FilterTabs {...tabs} />
          </>
        ) : null}
        <Gate />
      </Suspense>
      <output data-testid="accepted-search">
        {f.app.C.getSnapshot().query.search || "(empty)"}
      </output>
      <output data-testid="observations">{f.observed.length}</output>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
Object.assign(window, {
  criteriaSearchTabs: {
    counts: () => ({
      candidateReads,
      observations: f.observed.length,
      phase: f.app.P.getSnapshot().phase,
      selection: f.app.C.getSnapshot().selection,
    }),
  },
});
