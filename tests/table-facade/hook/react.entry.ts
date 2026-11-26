import { createElement, StrictMode, Suspense, startTransition } from "react";
import { createRoot } from "react-dom/client";
import type {
  DataTableModel,
  DataTableOptions,
} from "../../../packages/react/src/table/types.js";
import {
  requireDataTableModel,
  useDataTable,
} from "../../../packages/react/src/table/use-data-table.js";
import {
  type Fixture,
  fixture,
  type Item,
  records,
  type Schema,
} from "./fixtures.js";

function mount(
  f: Fixture,
  initial: DataTableOptions<Schema, Item>,
  id: string,
) {
  const container = document.createElement("div");
  container.id = id;
  document.body.append(container);
  const root = createRoot(container);
  let model: DataTableModel<Schema, Item> | null = null;
  let input = initial,
    renders = 0,
    renderPrivate = 0,
    suspendedReads = 0,
    rendering = false;
  const phases: string[] = [],
    never = new Promise<never>(() => {});
  f.faults.onPrivate = () => {
    if (rendering) {
      renderPrivate++;
      throw new Error("Facade private projection in render");
    }
  };
  // Exactly one APP connection, never the facade's. Original lease must stay valid.
  const disconnectApplication = f.resource.connect();
  function View(props: {
    input: DataTableOptions<Schema, Item>;
    suspend: boolean;
  }) {
    rendering = true;
    let result: DataTableModel<Schema, Item>;
    try {
      result = useDataTable(f.D, props.input);
    } finally {
      rendering = false;
    }
    renders++;
    phases.push(result.phase);
    if (props.suspend) throw never;
    model = result;
    return createElement(
      "output",
      null,
      `${result.phase}/${result.recovery.kind}/${result.view?.rows.length ?? "none"}`,
    );
  }
  function render(next = input, suspend = false) {
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
    rerender() {
      input = {
        ...input,
        expected: { ...input.expected },
        source: { ...input.source },
      };
      render();
    },
    suspend() {
      const candidate = Object.defineProperty({ ...input }, "source", {
        get() {
          suspendedReads++;
          throw new Error("Abandoned candidate source");
        },
      });
      startTransition(() => render(candidate, true));
    },
    finish() {
      input = f.options("client", records.slice(0, 3));
      render();
    },
    select() {
      f.app.change({ type: "selection.change", update: { r1: true } });
    },
    hide() {
      f.app.change({ type: "columns.visibility", update: { title: false } });
    },
    tick() {
      f.tick();
    },
    revoke() {
      f.resource.setContext({ ...f.context, access: false });
    },
    blockP() {
      f.app.reset();
    },
    swapC() {
      const other = fixture();
      other.app.settle();
      input = { ...input, controller: other.app.C };
      render();
    },
    swapP() {
      const other = fixture();
      input = { ...input, publication: other.app.P };
      render();
    },
    beginB() {
      f.app.change({ type: "search.commit", search: "B" });
      return f.start(() => {});
    },
    remoteEmpty() {
      const request = f.start();
      f.succeed(request.request, [], "dataset");
    },
    resetSource() {
      const request = f.start();
      f.succeed(request.request, records.slice(0, 3));
      input = f.options("server");
      render();
    },
    reenter() {
      let once = false;
      f.faults.onPrivate = () => {
        if (rendering) {
          renderPrivate++;
          throw 0;
        }
        if (!once) {
          once = true;
          f.app.reset();
        }
      };
      input = f.options("client", records.slice(0, 5));
      render();
    },
    state() {
      let current = false;
      if (model)
        try {
          requireDataTableModel(model, f.D);
          current = true;
        } catch {
          /* read-time deny */
        }
      return {
        text: container.textContent,
        renders,
        phases: [...phases],
        phase: model?.phase,
        recovery: model?.recovery,
        renderPrivate,
        suspendedReads,
        current,
        rowCount: model?.view?.rows.length ?? null,
        selected: model?.presentation?.selectedIds ?? [],
        columns: model?.view?.visibleColumns.map((column) => column.id) ?? [],
        queryIdentity: model?.state?.queryIdentity,
        nativeQueryIdentity: model?.view?.state.queryIdentity,
        sourceOnly: !!model?.sourceTarget && !model.toolTarget,
        tool: !!model?.toolTarget,
        counts: { ...f.counts },
        resetCount: f.app.counts.reset,
        disposed: f.app.C.isDisposed(),
        resourceActive: f.resource.getSnapshot().active,
        resourceKind: f.resource.getSnapshot().kind,
      };
    },
    unmount() {
      root.unmount();
    },
    disconnectApplication,
  };
}
const client = fixture();
client.app.settle();
const unsliced = fixture(false);
unsliced.app.settle();
const remote = fixture();
remote.app.settle();
const a = remote.start();
remote.succeed(a.request, records.slice(0, 4));
const empty = fixture();
empty.app.settle();
const e = empty.start();
empty.succeed(e.request, [], "filtered");
const failure = fixture();
failure.app.settle();
let retries = 0;
const failed = failure.start(() => {
  retries++;
});
failure.resource.fail(failed.request, "offline");
const relative = fixture(true, "relative");
relative.app.settle();
const complete = fixture(false);
complete.app.settle();
const c = complete.start();
complete.succeed(c.request);
const api = {
  client: mount(client, client.options(), "client"),
  unsliced: mount(unsliced, unsliced.options(), "unsliced"),
  remote: mount(remote, remote.options("server"), "remote"),
  empty: mount(empty, empty.options("server"), "empty"),
  failure: mount(failure, failure.options("server"), "failure"),
  relative: mount(relative, relative.options(), "relative"),
  complete: mount(complete, complete.options("server-complete"), "complete"),
  retries: () => retries,
};
declare global {
  interface Window {
    facadeHook: typeof api;
  }
}
window.facadeHook = api;
