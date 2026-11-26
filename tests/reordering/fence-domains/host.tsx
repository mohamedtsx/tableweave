import { useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  useDataTable,
  requireDataTableModel,
} from "../../../packages/react/src/table/use-data-table.js";
import type { DataTableModel } from "../../../packages/react/src/table/types.js";
import {
  claimReorderUI,
  joinReorderModel,
  releaseReorderUI,
  requireReorderModel,
} from "../../../packages/react/src/reordering-controller/index.js";
import type {
  ReorderUIBinding,
  ReorderModelJoin,
} from "../../../packages/react/src/reordering-controller/types.js";
import {
  createDataTableRendererCell,
  requireTableRendererTarget,
} from "../../../packages/heroui/src/table/renderer-commit.js";
import type {
  TableRendererActor,
  TableRendererLease,
  TableRendererCell,
} from "../../../packages/heroui/src/table/types.js";
import {
  fixture,
  required,
  type Fixture,
  type Item,
  type S,
} from "../admission/fixtures.js";

/** Genuine ordinary/uncontrolled C; app activation is outside renderer effects. */
export type HostFixture = Pick<
  Fixture,
  "D" | "C" | "admission" | "options" | "dispose" | "callbacks" | "metadata"
>;
export function host(input?: HostFixture) {
  const f = input ?? fixture(false),
    appLease = f.admission.mount();
  let model: DataTableModel<S, Item> | null = null;
  let cell: TableRendererCell<S, Item> | null = null;
  let lease: TableRendererLease<S, Item> | null = null;
  let actor: TableRendererActor<S, Item> | null = null;
  let binding: ReorderUIBinding<S, Item> | null = null;
  let joined: ReorderModelJoin<S, Item> | null = null;
  function Source() {
    const current = useDataTable(f.D, f.options());
    const [renderer] = useState(() => createDataTableRendererCell(current));
    useLayoutEffect(() => {
      cell = renderer;
      lease = renderer.connect();
      return () => {
        if (binding) releaseReorderUI(binding);
        if (lease) renderer.disconnect(lease);
      };
    }, [renderer]);
    useLayoutEffect(() => {
      try {
        requireDataTableModel(current, f.D);
      } catch {
        return;
      }
      if (
        current.phase !== "display" ||
        !current.toolTarget ||
        !current.authority ||
        current.presentation?.busy
      )
        return;
      f.admission.commitModel(appLease, current);
      const active = required(lease);
      actor = renderer.commit(active, current, {
        collection: {
          label: "Synthetic uncontrolled table",
          rowHeaderColumnId: "amount",
          rowTextValue: (row) => row.id,
          columnTextValue: (column) => column.id,
          cellTextValue: (value) => String(value.getValue()),
        },
      });
      const actual = requireTableRendererTarget({ cell: renderer, actor });
      binding ??= claimReorderUI(f.D, f.admission, appLease, renderer);
      joined = joinReorderModel(binding, actual.model, actor);
      model = current;
    }, [current, renderer]);
    return <output>Actual uncontrolled source</output>;
  }
  const node = document.createElement("section");
  document.body.append(node);
  const root = createRoot(node);
  const render = () => flushSync(() => root.render(<Source />));
  render();
  return {
    f,
    appLease,
    render,
    ready: () => joined !== null,
    model: () => required(model),
    join: () => required(joined),
    binding: () => required(binding),
    current() {
      const target = { cell: required(cell), actor: required(actor) };
      const value = requireTableRendererTarget(target);
      requireReorderModel(required(joined), value.model);
      return value;
    },
    dispose() {
      flushSync(() => root.unmount());
      node.remove();
      f.admission.disconnect(appLease);
      f.dispose();
    },
  };
}
export async function uncontrolled() {
  const h = host();
  for (let turn = 0; turn < 6 && !h.ready(); turn++) await Promise.resolve();
  if (!h.ready())
    throw new Error("Genuine uncontrolled committed model required");
  try {
    const order: string[] = [];
    const before = h.f.C.getSnapshot();
    h.f.callbacks.query = () => {
      order.push(`query:${h.f.admission.getSnapshot().phase}`);
      releaseReorderUI(h.binding());
      if (h.f.C.getSnapshot() === before)
        throw new Error("Actual C assignment must precede query observer");
    };
    h.f.callbacks.commit = () => {
      order.push(`commit:${h.f.admission.getSnapshot().phase}`);
    };
    const result = h.f.C.dispatch({
      type: "sorting.change",
      update: [{ id: "amount", desc: true }],
    });
    return {
      committed: result.status === "committed",
      sameC: h.f.C.getSnapshot() === before,
      order,
      notificationFailures:
        result.status === "committed" ? result.notificationFailures : -1,
    };
  } finally {
    h.dispose();
  }
}
