import { createElement, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/dist/contracts/index.js";
import type {
  StateProposal,
  TableState,
} from "../../packages/react/dist/index.js";
import {
  createTableController,
  useTableweaveQuery,
  useTableweaveSelector,
  useTableweaveState,
} from "../../packages/react/dist/index.js";

const schema = defineQuerySchema({
  id: "react-fixture",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
const initial = createQuery(schema, {
  locale: "en-US",
  timeZone: "UTC",
  builder: {
    join: "and",
    rules: [{ id: "r1", field: "amount", operator: "number.eq", value: 1 }],
  },
});
let proposal: StateProposal<typeof schema> | undefined;
let requests = 0;
let queryNotifications = 0;
const controller = createTableController(
  { schema, selection: true },
  {
    initial: { query: initial },
    controlled: ["query"],
    now: () => 0,
    onRequest(next) {
      proposal = next;
      requests++;
    },
    onQueryChange() {
      queryNotifications++;
    },
  },
);
let queryRenders = 0;
let selectionRenders = 0;
let stableEffects = 0;
let inlineEffects = 0;
function Query() {
  const query = useTableweaveQuery(controller);
  queryRenders++;
  return createElement(
    "output",
    { id: "query", "data-renders": queryRenders },
    String(query.builder.rules.length),
  );
}
const selectCount = (state: TableState<typeof schema>) => ({
  count: Object.keys(state.selection).length,
});
const equalCount = (a: { count: number }, b: { count: number }) =>
  a.count === b.count;
function Selection() {
  const value = useTableweaveSelector(controller, selectCount, equalCount);
  useEffect(() => {
    document
      .getElementById("selection")
      ?.setAttribute("data-effects", String(++stableEffects));
  }, [value]);
  selectionRenders++;
  return createElement(
    "output",
    { id: "selection", "data-renders": selectionRenders },
    String(value.count),
  );
}
function InlineSelection({ offset }: { offset: number }) {
  const value = useTableweaveSelector(
    controller,
    (state) => ({ count: Object.keys(state.selection).length + offset }),
    equalCount,
  );
  useEffect(() => {
    document
      .getElementById("inline-selection")
      ?.setAttribute("data-effects", String(++inlineEffects));
  }, [value]);
  return createElement(
    "output",
    { id: "inline-selection" },
    String(value.count),
  );
}
function Snapshot() {
  const state = useTableweaveState(controller);
  return createElement(
    "output",
    { id: "snapshot" },
    `${state.revision}/${state.query.builder.rules.length}/${Object.keys(state.selection).length}`,
  );
}
function publish() {
  const status = document.getElementById("requests");
  if (status) status.textContent = `${requests}/${queryNotifications}`;
}
const button = (label: string, action: () => void) =>
  createElement(
    "button",
    {
      type: "button",
      onClick() {
        action();
        publish();
      },
    },
    label,
  );
function App() {
  const [unrelated, setUnrelated] = useState(0);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    document
      .getElementById("parent")
      ?.setAttribute("data-committed", `${unrelated}/${offset}`);
  }, [unrelated, offset]);
  return createElement(
    "main",
    null,
    createElement(Query),
    createElement(Selection),
    createElement(InlineSelection, { offset }),
    createElement("output", { id: "parent" }, `${unrelated}/${offset}`),
    createElement(Snapshot),
    createElement("output", { id: "requests" }, "0/0"),
    button("Select", () => {
      controller.dispatch({
        type: "selection.change",
        update: { synthetic: true },
      });
    }),
    button("Propose Clear", () => {
      controller.dispatch({ type: "builder.clear" });
    }),
    button("Reject", () => {
      if (proposal) controller.reject(proposal);
      proposal = undefined;
    }),
    button("Accept", () => {
      if (proposal) controller.accept(proposal);
      proposal = undefined;
    }),
    button("Noop", () => {
      controller.dispatch({ type: "clock.tick" });
    }),
    button("Unrelated render", () => {
      setUnrelated((value) => value + 1);
    }),
    button("Selector Offset", () => {
      setOffset((value) => value + 1);
    }),
    button("Unmount", () => {
      root.unmount();
      controller.dispose();
    }),
  );
}
const element = document.getElementById("root");
if (!element) throw new Error("Missing fixture root");
const root = createRoot(element);
root.render(createElement(StrictMode, null, createElement(App)));
