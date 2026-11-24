import { createElement, StrictMode, Suspense, startTransition } from "react";
import { createRoot } from "react-dom/client";
import {
  requireCriteriaSource,
  requireCriteriaTool,
} from "../../packages/react/src/presentation/criteria-frame.js";
import {
  type CriteriaFrameReactInput,
  type CriteriaFrameReactResult,
  useCriteriaFrame,
} from "../../packages/react/src/presentation/criteria-frame-react.js";
import {
  begin,
  type Fixture,
  fixture,
  type Item,
  records,
  required,
  type Schema,
  sourceInput,
} from "./fixtures.js";

type Result = CriteriaFrameReactResult<Schema, Item>;
function mount(
  f: Fixture,
  input: CriteriaFrameReactInput<Schema, Item>,
  id: string,
) {
  const container = document.createElement("div");
  container.id = id;
  document.body.append(container);
  const root = createRoot(container);
  let result: Result = null,
    renders = 0,
    sourceReads = 0;
  let candidate = input;
  const phases: string[] = [];
  const never = new Promise<never>(() => {});
  function View(props: {
    input: CriteriaFrameReactInput<Schema, Item>;
    suspend: boolean;
  }) {
    const current = useCriteriaFrame(f.frames, props.input);
    renders++;
    phases.push(current?.phase ?? "null");
    if (props.suspend) throw never;
    result = current;
    return createElement(
      "output",
      null,
      current
        ? `${current.phase}/${current.frame?.view.rows.length ?? "none"}/${current.metadata.mode === "client" ? "client" : current.metadata.kind}`
        : "null",
    );
  }
  function render(next = candidate, suspend = false) {
    candidate = next;
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(
          Suspense,
          { fallback: "waiting" },
          createElement(View, { input: next, suspend }),
        ),
      ),
    );
  }
  render();
  return {
    render,
    rerender() {
      // Ordinary applications reallocate envelopes; semantic identities remain.
      render({
        ...input,
        expected: { ...input.expected },
        source: { ...input.source },
        ...(input.nativeInput ? { nativeInput: { ...input.nativeInput } } : {}),
      });
    },
    suspend() {
      const poison = {
        ...input,
        source: Object.defineProperty({}, "mode", {
          get() {
            sourceReads++;
            throw new Error("Abandoned source must stay inert");
          },
        }),
      } as typeof input;
      startTransition(() => render(poison, true));
    },
    complete() {
      input = f.input("client", records.slice(0, 3));
      render(input);
    },
    select() {
      f.accept({ type: "selection.change", update: { r1: true } });
    },
    hideColumn() {
      f.accept({ type: "columns.visibility", update: { title: false } });
    },
    changeQuery() {
      f.accept({ type: "search.commit", search: "changed" });
    },
    deny() {
      f.resource.setContext({ ...f.context, access: false });
    },
    reset() {
      const pending = f.app.beginReset();
      if (pending.status !== "pending") throw new Error("Missing real reset");
      f.app.completeReset(pending.ticket);
    },
    reenter() {
      f.callbacks.rowId = () => {
        delete f.callbacks.rowId;
        f.app.beginReset();
      };
      input = f.input("client", records.slice(0, 6));
      render(input);
    },
    remote() {
      f.startRemote(records.slice(0, 2));
      input = f.input(
        f.definition.paginationEnabled ? "server" : "server-complete",
      );
      render(input);
    },
    updateRemote() {
      const request = begin(f);
      f.resource.succeed(request.request, {
        source: "fresh",
        records: records.slice(0, 4),
        page: { kind: "known", total: 4 },
        emptyKind: "unknown",
        receivedAt: "2026-11-24T00:00:00Z",
      });
    },
    state() {
      let sourceAllowed = false,
        toolAllowed = false;
      if (result) {
        try {
          requireCriteriaSource(result.sourceAuthority, f.frames);
          sourceAllowed = true;
        } catch {
          /* denied */
        }
        if (result.pair)
          try {
            requireCriteriaTool(result.pair.tool, f.frames);
            toolAllowed = true;
          } catch {
            /* denied */
          }
      }
      const displayed = toolAllowed ? result?.frame : null;
      const controls = toolAllowed ? result?.pair?.controls.read() : null;
      return {
        text: container.textContent,
        renders,
        phases: [...phases],
        sourceReads,
        sourceAllowed,
        toolAllowed,
        phase: result?.phase ?? null,
        nativeRevision: displayed?.view.state.revision ?? null,
        revision: f.app.C.getSnapshot().revision,
        columns:
          displayed?.view.visibleColumns.map((column) => column.id) ?? [],
        selected: controls?.selectedIds ?? [],
        canReorder: controls?.canReorder ?? false,
        canRetry:
          result?.metadata.mode !== "client" &&
          result?.metadata.canRetry === true,
        modelCalls: Object.values(f.counts).reduce((a, b) => a + b, 0),
        controllerDisposed: f.app.C.isDisposed(),
        publicationPhase: f.app.P.getSnapshot().phase,
        resourceKind: f.resource.getSnapshot().kind,
      };
    },
    unmount() {
      root.unmount();
    },
  };
}
const client = fixture();
client.settle();
client.reset();
const failure = fixture();
failure.settle();
let retries = 0;
const failed = begin(failure, () => {
  retries++;
});
failure.resource.fail(failed.request, "timeout");
failure.reset();
const complete = fixture(false);
complete.settle();
complete.startRemote();
complete.reset();
const one = mount(client, { ...client.input(), manualOrder: true }, "client");
const two = mount(failure, sourceInput(failure, "server"), "failure");
const three = mount(complete, complete.input("server-complete"), "complete");
const api = {
  one,
  two,
  three,
  retries: () => retries,
  ready: () => required(document.getElementById("client")).textContent !== "",
};
declare global {
  interface Window {
    criteriaReactFixture: typeof api;
  }
}
window.criteriaReactFixture = api;
