import {
  createElement,
  StrictMode,
  Suspense,
  startTransition,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import type {
  ResourceContext,
  ResourceRequest,
} from "../../packages/react/dist/resource/index.js";
import {
  createResourceAdapter,
  useTableweaveResource,
} from "../../packages/react/dist/resource/index.js";
import type { Row } from "./fixtures.js";
import { context, input, success } from "./fixtures.js";

const requests: ResourceRequest[] = [];
const invalidations: string[] = [];
const renders: {
  scope: string;
  access: boolean;
  rows: string[];
  kind: string;
}[] = [];
const app = { selection: ["a"], details: "a", labels: ["Label A"], move: "a" };
const adapter = createResourceAdapter<Row>(context, {
  onInvalidate({ reason }) {
    invalidations.push(reason);
    app.selection = [];
    app.details = "";
    app.labels = [];
    app.move = "";
  },
});
let lastAcceptance: boolean | null = null;
let fetchEffects = 0;
let fetchCleanups = 0;
const cleanupObservations: {
  active: boolean;
  rows: string[];
  lateAccepted: boolean;
}[] = [];
const never = new Promise<never>(() => {});

function request(expected: ResourceContext) {
  const token = adapter.begin(
    input(expected.scopeKey, 0, {
      definitionKey: expected.definitionKey,
      scopeKey: expected.scopeKey,
    }),
  );
  if (token) requests.push(token);
  if (token && new URLSearchParams(location.search).has("revoke-on-mount"))
    adapter.fail(token, "access-lost");
  if (token && new URLSearchParams(location.search).has("ready-on-mount"))
    adapter.succeed(token, success([`${token.scopeKey}:${token.generation}`]));
  return token;
}
function Consumer({
  expected,
  suspend,
}: {
  expected: ResourceContext;
  suspend: boolean;
}) {
  const view = useTableweaveResource(adapter, expected);
  const { scopeKey, definitionKey, access } = expected;
  useEffect(() => {
    fetchEffects++;
    const token = access ? request({ scopeKey, definitionKey, access }) : null;
    // Transport deliberately has no cancellation support.
    return () => {
      fetchCleanups++;
      const current = adapter.getSnapshot();
      cleanupObservations.push({
        active: current.active,
        rows: current.snapshot?.records.map((row) => row.id) ?? [],
        // An uncancellable completion during the application's own cleanup
        // must already be rejected by the preceding owning-hook cleanup.
        lateAccepted: token
          ? adapter.succeed(token, success(["cleanup-late"]))
          : false,
      });
    };
  }, [scopeKey, definitionKey, access]);
  renders.push({
    scope: expected.scopeKey,
    access: expected.access,
    rows: view.snapshot?.records.map((row) => row.id) ?? [],
    kind: view.kind,
  });
  if (suspend) throw never;
  return createElement(
    "output",
    {
      id: "resource",
      "data-kind": view.kind,
      "data-scope": view.context.scopeKey,
      "data-active": String(view.active),
      "data-stale": String(view.stale),
      "data-busy": String(view.busy),
    },
    view.snapshot?.records.map((row) => row.id).join(",") ?? "none",
  );
}
function Harness() {
  const [expected, setExpected] = useState<ResourceContext>(context);
  const [mounted, setMounted] = useState(true);
  const [suspend, setSuspend] = useState(false);
  const button = (label: string, onClick: () => void) =>
    createElement("button", { type: "button", onClick, key: label }, label);
  return createElement(
    "main",
    null,
    createElement(
      Suspense,
      { fallback: createElement("p", { id: "fallback" }, "Suspended") },
      mounted
        ? createElement(Consumer, { expected, suspend })
        : createElement("p", { id: "unmounted" }, "Unmounted"),
    ),
    button("Resolve latest", () => {
      const token = requests.at(-1);
      if (token)
        lastAcceptance = adapter.succeed(
          token,
          success([`${token.scopeKey}:${token.generation}`]),
        );
    }),
    button("Resolve oldest", () => {
      const token = requests[0];
      if (token)
        lastAcceptance = adapter.succeed(token, success(["late-oldest"]));
    }),
    button("Refresh", () => request(expected)),
    button("Fail latest", () => {
      const token = requests.at(-1);
      if (token) lastAcceptance = adapter.fail(token, "timeout");
    }),
    button("Revoke in response", () => {
      const token = requests.at(-1);
      if (token) lastAcceptance = adapter.fail(token, "access-lost");
    }),
    button("Scope B", () => setExpected({ ...expected, scopeKey: "scope-b" })),
    button("Deny", () => setExpected({ ...expected, access: false })),
    button("Allow", () => setExpected({ ...expected, access: true })),
    button("Definition 2", () =>
      setExpected({ ...expected, definitionKey: "definition-2" }),
    ),
    button("Toggle mount", () => setMounted((value) => !value)),
    button("Hide same scope", () => setSuspend(true)),
    button("Reveal same scope", () => setSuspend(false)),
    button("Speculative B", () =>
      startTransition(() => {
        setExpected({ ...expected, scopeKey: "scope-b" });
        setSuspend(true);
      }),
    ),
    button("Cancel speculative", () => {
      setExpected(context);
      setSuspend(false);
    }),
  );
}
declare global {
  interface Window {
    resourceFixture: {
      inspect: () => {
        generations: number[];
        invalidations: string[];
        renders: typeof renders;
        rows: string[];
        active: boolean;
        app: typeof app;
        lastAcceptance: boolean | null;
        fetchEffects: number;
        fetchCleanups: number;
        cleanupObservations: typeof cleanupObservations;
      };
      seedApp: () => void;
    };
  }
}
window.resourceFixture = {
  inspect: () => ({
    generations: requests.map((token) => token.generation),
    invalidations: [...invalidations],
    renders: [...renders],
    rows: adapter.getSnapshot().snapshot?.records.map((row) => row.id) ?? [],
    active: adapter.getSnapshot().active,
    app,
    lastAcceptance,
    fetchEffects,
    fetchCleanups,
    cleanupObservations: [...cleanupObservations],
  }),
  seedApp() {
    app.selection = ["a"];
    app.details = "a";
    app.labels = ["Label A"];
    app.move = "a";
  },
};
const root = document.getElementById("root");
if (!root) throw new Error("Missing synthetic fixture root");
const tree = createElement(Harness);
createRoot(root).render(
  new URLSearchParams(location.search).has("without-strict")
    ? tree
    : createElement(StrictMode, null, tree),
);
