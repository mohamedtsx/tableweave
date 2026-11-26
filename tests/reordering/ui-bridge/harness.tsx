import {
  StrictMode,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { DataTableModel } from "../../../packages/react/src/table/types.js";
import {
  requireDataTableModel,
  useDataTable,
} from "../../../packages/react/src/table/use-data-table.js";
import {
  captureReorderNavigation,
  claimReorderUI,
  joinReorderModel,
  observeReorderUI,
  releaseReorderUI,
  requireReorderModel,
  requireReorderNavigation,
  suspendReorderUI,
  type ReorderModelJoin,
  type ReorderUIBinding,
} from "../../../packages/react/src/reordering-controller/index.js";
import type {
  RowMoveOperation,
  RowMoveSettlement,
} from "../../../packages/react/src/reordering/types.js";
import {
  createDataTableRendererCell,
  requireTableRendererTarget,
} from "../../../packages/heroui/src/table/renderer-commit.js";
import type {
  TableRendererActor,
  TableRendererCell,
  TableRendererConfig,
  TableRendererLease,
  TableRendererTarget,
} from "../../../packages/heroui/src/table/types.js";
import {
  fixture,
  records,
  required,
  type Item,
  type S,
} from "../admission/fixtures.js";

type Model = DataTableModel<S, Item>;
type UI = {
  cell: TableRendererCell<S, Item>;
  lease: TableRendererLease<S, Item>;
  binding: ReorderUIBinding<S, Item> | null;
  join: ReorderModelJoin<S, Item> | null;
  actor: TableRendererActor<S, Item> | null;
};
export function harness(server = false, unpaged = false) {
  const f = fixture(true, server, unpaged);
  // Real application activation, outside the model/UI effects and Strict replay.
  const appLease = f.admission.mount();
  let sourceRecords: readonly Item[] = unpaged
    ? records.concat(
        Array.from({ length: 8 }, (_, i) => ({
          id: `extra-${i}`,
          amount: i + 4,
        })),
      )
    : records;
  let actual: Model | null = null,
    published: Model | null = null;
  let ui: UI | null = null,
    shown = true;
  let configRevision = 0;
  let operation: RowMoveOperation | null = null;
  let notice: RowMoveSettlement | null = null;
  let delivered = 0,
    renders = 0,
    appBodies = 0;
  const errors: string[] = [];
  const config: TableRendererConfig<S, Item> = {
    collection: {
      label: "Synthetic bridge rows",
      rowHeaderColumnId: "amount",
      rowTextValue(row) {
        appBodies++;
        return row.id;
      },
      columnTextValue(column) {
        appBodies++;
        return column.id;
      },
      cellTextValue(cell) {
        appBodies++;
        return String(cell.getValue());
      },
    },
  };
  function options() {
    const current = f.options();
    return server
      ? current
      : {
          ...current,
          source: {
            mode: "client" as const,
            context: f.context,
            records: sourceRecords,
          },
        };
  }
  function Renderer({ model, revision }: { model: Model; revision: number }) {
    const [cell] = useState(() => createDataTableRendererCell(model));
    const lifetime = useRef<UI | null>(null);
    const metadata = useSyncExternalStore(
      (listener) => f.admission.subscribe(listener),
      () => {
        const binding = lifetime.current?.binding;
        return binding ? observeReorderUI(binding) : null;
      },
      () => null,
    );
    useLayoutEffect(() => {
      const life: UI = {
        cell,
        lease: cell.connect(),
        binding: null,
        join: null,
        actor: null,
      };
      lifetime.current = life;
      ui = life;
      return () => {
        if (life.binding) releaseReorderUI(life.binding);
        cell.disconnect(life.lease);
        if (lifetime.current === life) lifetime.current = null;
        if (ui === life) ui = null;
      };
    }, [cell]);
    useLayoutEffect(() => {
      const life = lifetime.current;
      if (!life) return;
      try {
        requireDataTableModel(model, f.D);
        if (life.binding) suspendReorderUI(life.binding);
        life.actor = cell.commit(life.lease, model, {
          ...config,
          layout: { id: `config-${revision}` },
        });
        if (model.phase !== "display") return;
        const target = { cell, actor: life.actor };
        const current = requireTableRendererTarget(target);
        if (current.model !== model)
          throw new Error("Actual model join required");
        life.binding ??= claimReorderUI(f.D, f.admission, appLease, cell);
        life.join = joinReorderModel(life.binding, current.model, life.actor);
        requireReorderModel(
          life.join,
          requireTableRendererTarget(target).model,
        );
      } catch (error) {
        errors.push(error instanceof Error ? error.name : "unavailable");
      }
    }, [cell, model, revision]);
    renders++;
    return <output>Actual bridge renderer {String(metadata?.joined)}</output>;
  }
  function Source() {
    const model = useDataTable(f.D, options());
    const appMetadata = f.metadata();
    actual = model;
    const [committed, setCommitted] = useState<Model | null>(null);
    useLayoutEffect(() => {
      try {
        requireDataTableModel(model, f.D);
      } catch {
        return;
      }
      // Source-only/wait models are genuine but cannot be passed to commitModel.
      // Its original failure semantics are intentionally not a waiting-state API.
      if (
        model.phase !== "display" ||
        !model.sourceTarget ||
        !model.toolTarget ||
        !model.frame ||
        !model.view ||
        !model.authority ||
        !model.presentation?.displayed ||
        model.presentation.busy
      )
        return;
      try {
        const facts = model.authority.read();
        if (!facts.displayed || facts.obsolete || facts.resourceObsolete)
          return;
      } catch {
        return;
      }
      f.admission.commitModel(appLease, model);
      published = model;
      setCommitted((before) => (before === model ? before : model));
      if (notice && operation && !model.presentation?.busy) {
        const outcome = notice;
        notice = null;
        f.admission.settle(operation, outcome);
        delivered++;
      }
    }, [model, appMetadata]);
    return committed && shown ? (
      <StrictMode>
        <Renderer model={committed} revision={configRevision} />
      </StrictMode>
    ) : null;
  }
  const node = document.createElement("section");
  document.body.append(node);
  const root = createRoot(node);
  const render = () => flushSync(() => root.render(<Source />));
  render();
  const currentUI = () => required(ui);
  const model = () => required(published);
  function target(): TableRendererTarget<S, Item> {
    const current = currentUI();
    return { cell: current.cell, actor: required(current.actor) };
  }
  function join() {
    return required(currentUI().join);
  }
  return {
    f,
    appLease,
    model,
    currentUI,
    target,
    join,
    errors,
    render,
    information: () => ({
      ready: f.admission.getSnapshot().phase,
      joined: ui?.binding ? observeReorderUI(ui.binding).joined : false,
      appMetadata: f.metadata(),
      errors,
      renders,
      appBodies,
    }),
    origin: () => captureReorderNavigation(join()),
    requireOrigin(
      origin: ReturnType<typeof captureReorderNavigation<S, Item>>,
    ) {
      requireReorderNavigation(
        origin,
        join(),
        requireTableRendererTarget(target()).model,
      );
    },
    begin() {
      const captured = f.admission.capture(appLease);
      const result = f.admission.begin(captured, {
        movedId: "one",
        beforeId: "three",
        afterId: "two",
      });
      if (result.status !== "started")
        throw new Error("Actual started row move required");
      operation = result.operation;
      return operation;
    },
    operation: () => required(operation),
    hide() {
      shown = false;
      render();
    },
    show() {
      shown = true;
      render();
    },
    configB() {
      configRevision++;
      render();
    },
    rejected() {
      return f.admission.settle(required(operation), {
        kind: "rejected",
        code: "conflict",
      });
    },
    accepted() {
      return f.admission.settle(required(operation), {
        kind: "accepted",
        revision: "transport",
      });
    },
    refresh() {
      f.refresh();
      render();
    },
    recordNotice(outcome: RowMoveSettlement) {
      notice = outcome;
    },
    delivered: () => delivered,
    authoritative() {
      if (server) f.removeFormerRow();
      else {
        const one = required(sourceRecords.find((row) => row.id === "one"));
        const rest = sourceRecords.filter((row) => row.id !== "one");
        sourceRecords = [required(rest[0]), one, ...rest.slice(1)];
        const before = f.metadata();
        f.setMetadata({
          ...before,
          sourceVersion: before.sourceVersion + 1,
          revision: "authoritative",
          baseRevision: "authoritative",
        });
      }
      render();
    },
    acknowledge() {
      const metadata = f.metadata(),
        state = f.C.getSnapshot();
      return f.admission.acknowledge(required(operation), {
        stamp: {
          ownerEpoch: metadata.ownerEpoch,
          sourceVersion: metadata.sourceVersion,
          revision: metadata.revision,
          definitionKey: f.context.definitionKey,
          scopeKey: f.context.scopeKey,
          queryIdentity: state.queryIdentity,
          pageIndex: state.query.pagination.pageIndex,
          pageSize: state.query.pagination.pageSize,
          ...(unpaged ? { extent: "complete" as const } : {}),
        },
        disposition: server ? "superseded" : "applied",
      });
    },
    foreignModel() {
      let foreign: Model | null = null;
      const child = document.createElement("div");
      document.body.append(child);
      const foreignRoot = createRoot(child);
      function Foreign() {
        foreign = useDataTable(f.D, options());
        return <output>Foreign genuine source owner</output>;
      }
      flushSync(() => foreignRoot.render(<Foreign />));
      return {
        read: () => required(foreign),
        dispose() {
          flushSync(() => foreignRoot.unmount());
          child.remove();
        },
      };
    },
    actual: () => required(actual),
    dispose() {
      flushSync(() => root.unmount());
      node.remove();
      f.admission.disconnect(appLease);
      f.dispose();
    },
  };
}
export type Harness = ReturnType<typeof harness>;
