import { StrictMode, useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { useDataTable } from "../../../packages/react/src/table/use-data-table.js";
import type { DataTableModel } from "../../../packages/react/src/table/types.js";
import type {
  ReorderAdmissionLease,
  ReorderInteraction,
} from "../../../packages/react/src/reordering-controller/index.js";
import type { RowMoveOperation } from "../../../packages/react/src/reordering/types.js";
import { fixture, type Item, required, type S } from "./fixtures.js";

export function harness(controlled = true, server = false, unpaged = false) {
  const f = fixture(controlled, server, unpaged);
  let model: DataTableModel<S, Item> | null = null;
  let lease: ReorderAdmissionLease<S, Item> | null = null;
  const errors: string[] = [];
  function Screen() {
    const actual = useDataTable(f.D, f.options());
    const appMetadata = f.metadata();
    model = actual;
    const mounted = useRef<ReorderAdmissionLease<S, Item> | null>(null);
    useLayoutEffect(() => {
      const acquired = f.admission.mount();
      mounted.current = acquired;
      lease = acquired;
      return () => {
        mounted.current = null;
        lease = null;
        f.admission.disconnect(acquired);
      };
    }, []);
    useLayoutEffect(() => {
      if (!mounted.current || actual.phase !== "display") return;
      try {
        f.admission.commitModel(mounted.current, actual);
      } catch (error) {
        errors.push(error instanceof Error ? error.name : "unavailable");
      }
    }, [actual, appMetadata]);
    return <output>Actual admission {f.admission.getSnapshot().phase}</output>;
  }
  const node = document.createElement("section");
  document.body.append(node);
  const root = createRoot(node);
  const render = () =>
    flushSync(() =>
      root.render(
        <StrictMode>
          <Screen />
        </StrictMode>,
      ),
    );
  render();
  let interaction: ReorderInteraction<S, Item> | null = null;
  let operation: RowMoveOperation | null = null;
  return {
    f,
    errors,
    render,
    model: () => required(model),
    lease: () => required(lease),
    capture() {
      interaction = f.admission.capture(required(lease));
      return interaction;
    },
    begin() {
      const result = f.admission.begin(required(interaction), {
        movedId: "one",
        beforeId: "three",
        afterId: "two",
      });
      if (result.status === "started") operation = result.operation;
      return result;
    },
    operation: () => required(operation),
    reject() {
      return f.admission.settle(required(operation), {
        kind: "rejected",
        code: "conflict",
      });
    },
    unmount() {
      flushSync(() => root.unmount());
      node.remove();
      f.dispose();
    },
  };
}
export type Harness = ReturnType<typeof harness>;
