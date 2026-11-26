import type { ResourceContext, StateProposal } from "@tableweave/react";
import {
  createResourceAdapter,
  createTableController,
  useTableweaveResource,
  useTableweaveState,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import {
  StrictMode,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { FilterDate } from "../../../packages/heroui/src/toolbar/filter-date.js";
import { FilterSearch } from "../../../packages/heroui/src/toolbar/filter-search.js";
import { FilterTabs } from "../../../packages/heroui/src/toolbar/filter-tabs.js";
import "../../../packages/heroui/src/toolbar/filter-tools.css";
import "../../../packages/heroui/src/date/date-editor.css";
import "./fixture.css";

const params = new URLSearchParams(location.search);
document.documentElement.classList.toggle("dark", params.has("dark"));
document.documentElement.dir = params.has("rtl") ? "rtl" : "ltr";
const now = Date.parse("2025-03-09T12:34:56.789Z");
const schema = defineQuerySchema({
  id: "toolbar-fixture",
  version: 1,
  fields: {
    name: { type: "text", owner: "search" },
    status: { type: "enum", owner: "tabs", values: ["open", "closed"] },
    happened: {
      type: "datetime",
      owner: "date",
      rollingDays: [7],
      ...(params.has("incompatible") ? { operators: ["date.on"] } : {}),
    },
  },
  tabs: [
    {
      id: "open",
      rules: [{ field: "status", operator: "enum.is", value: "open" }],
    },
    {
      id: "closed",
      rules: [{ field: "status", operator: "enum.is", value: "closed" }],
    },
  ],
  ...(params.has("zero") ? { search: { debounceMs: 0 } } : {}),
  ...(params.has("single") ? { date: { mode: "single" } } : {}),
});
type Schema = typeof schema;
const initialContext: ResourceContext = {
  definitionKey: "toolbar",
  scopeKey: "a",
  access: true,
};
const lifecycle = { mounts: 0, cleanups: 0, invalidations: 0 };
declare global {
  interface Window {
    toolbarLifecycle: typeof lifecycle;
    searchEffectEvents: string[];
  }
}
window.toolbarLifecycle = lifecycle;
window.searchEffectEvents = [];

const suspended = new Promise<never>(() => {});
function SearchSuspendGate({ hidden }: { readonly hidden: boolean }) {
  if (hidden) throw suspended;
  return null;
}
function SearchEffectProbe() {
  useLayoutEffect(() => {
    window.searchEffectEvents.push("layout-setup");
    return () => {
      window.searchEffectEvents.push("layout-cleanup");
    };
  }, []);
  useEffect(() => {
    window.searchEffectEvents.push("passive-setup");
    return () => {
      window.searchEffectEvents.push("passive-cleanup");
    };
  }, []);
  return null;
}

function Results({ context }: { readonly context: ResourceContext }) {
  const [resource] = useState(() =>
    createResourceAdapter<{ id: string }>(context, {
      onInvalidate: () => {
        lifecycle.invalidations += 1;
      },
    }),
  );
  const view = useTableweaveResource(resource, context);
  const [count, setCount] = useState(0);
  useEffect(() => {
    lifecycle.mounts += 1;
    return () => {
      lifecycle.cleanups += 1;
    };
  }, []);
  return (
    <section aria-label="Shared results" data-resource-active={view.active}>
      <button type="button" onClick={() => setCount((n) => n + 1)}>
        Results local state {count}
      </button>
      <table aria-label="Actual result records">
        <thead>
          <tr>
            <th scope="col">Name</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Synthetic record</th>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function Fixture() {
  const pending = useRef<StateProposal<Schema> | null>(null);
  const [context, setContext] = useState(initialContext);
  const [epoch, setEpoch] = useState(0);
  const [observations, setObservations] = useState(0);
  const [searchHidden, setSearchHidden] = useState(false);
  const [searchMounted, setSearchMounted] = useState(true);
  const [controller] = useState(() =>
    createTableController(
      { schema, selection: params.has("selection-override") },
      {
        initial: {
          query: createQuery(schema, {
            locale: params.has("rtl") ? "ar-EG" : "en-US",
            timeZone: "America/New_York",
          }),
        },
        now: () => now,
        ...(params.has("controlled")
          ? {
              controlled: params.has("selection-override")
                ? (["query", "selection"] as const)
                : (["query"] as const),
              onRequest: (proposal: StateProposal<Schema>) => {
                pending.current = proposal;
              },
            }
          : {}),
      },
    ),
  );
  const state = useTableweaveState(controller);
  const common = {
    controller,
    expectedContext: context,
    invalidationKey: epoch,
    onMutation: () => setObservations((count) => count + 1),
  };
  return (
    <main>
      <h1>Toolbar producer probes</h1>
      <div className="fixture-controls">
        <button
          type="button"
          onClick={() => {
            if (pending.current) {
              if (params.has("selection-override"))
                controller.accept(pending.current, {
                  selection: { synthetic: true },
                });
              else controller.accept(pending.current);
            }
            pending.current = null;
          }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => {
            if (pending.current) controller.reject(pending.current);
            pending.current = null;
          }}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() =>
            controller.dispatch({ type: "search.commit", search: "external" })
          }
        >
          External search
        </button>
        <button
          type="button"
          onClick={() =>
            setContext((value) => ({
              ...value,
              scopeKey: value.scopeKey === "a" ? "b" : "a",
            }))
          }
        >
          Change scope
        </button>
        <button
          type="button"
          onClick={() =>
            setContext((value) => ({ ...value, access: !value.access }))
          }
        >
          Toggle access
        </button>
        <button type="button" onClick={() => setEpoch((value) => value + 1)}>
          Invalidate drafts
        </button>
        <button
          type="button"
          onClick={() => setSearchHidden((value) => !value)}
        >
          Toggle search Suspense
        </button>
        <button
          type="button"
          onClick={() => setSearchMounted((value) => !value)}
        >
          Toggle search mounted
        </button>
        <button
          type="button"
          onClick={() => setContext((value) => ({ ...value }))}
        >
          Rerender same context
        </button>
      </div>
      <Suspense fallback={<p>Search Suspense fallback</p>}>
        {searchMounted ? (
          <>
            <SearchSuspendGate hidden={searchHidden} />
            <SearchEffectProbe />
            <FilterSearch {...common} />
          </>
        ) : null}
      </Suspense>
      <FilterDate {...common} />
      <FilterTabs
        {...common}
        tabs={{
          open: {
            label: "Open",
            count: { value: 0, description: "Application total" },
          },
          closed: { label: "Closed" },
        }}
        {...(params.has("missing-neutral")
          ? {}
          : { neutralTab: { label: "All records" } })}
      >
        <Results context={context} />
      </FilterTabs>
      <output data-testid="accepted-search">
        {state.query.search || "(empty)"}
      </output>
      <output data-testid="accepted-tab">
        {state.query.tabId ?? "neutral"}
      </output>
      <output data-testid="accepted-date">
        {JSON.stringify(state.query.date)}
      </output>
      <output data-testid="observations">{observations}</output>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Fixture root missing");
createRoot(root).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
