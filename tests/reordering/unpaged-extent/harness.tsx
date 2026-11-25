import { useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { DataTableModel } from "../../../packages/react/src/table/types.js";
import { useDataTable } from "../../../packages/react/src/table/use-data-table.js";
import {
  requireReorderAdmission,
  type ReorderAdmissionLease,
} from "../../../packages/react/src/reordering-controller/index.js";
import type { RowMoveOperation } from "../../../packages/react/src/reordering/index.js";
import { required, type Item, type S } from "../admission/fixtures.js";
import { extentApplication, type ExtentFixtureMode } from "./application.js";

export function extentHarness(mode: ExtentFixtureMode) {
  const app = extentApplication(mode),
    { f } = app;
  let model: DataTableModel<S, Item> | null = null;
  let lease: ReorderAdmissionLease<S, Item> | null = null;
  let operation: RowMoveOperation | null = null;
  const failures: string[] = [];
  function Screen() {
    const actual = useDataTable(f.D, app.options());
    const metadata = f.metadata();
    model = actual;
    const mounted = useRef<ReorderAdmissionLease<S, Item> | null>(null);
    useLayoutEffect(() => {
      const token = f.admission.mount();
      mounted.current = token;
      lease = token;
      return () => {
        mounted.current = null;
        lease = null;
        f.admission.disconnect(token);
      };
    }, []);
    useLayoutEffect(() => {
      if (!mounted.current || actual.phase !== "display") return;
      try {
        f.admission.commitModel(mounted.current, actual);
      } catch (error) {
        failures.push(error instanceof Error ? error.name : "unavailable");
      }
    }, [actual, metadata]);
    return (
      <output>
        {mode}: {actual.phase}
      </output>
    );
  }
  const node = document.createElement("section");
  document.body.append(node);
  const root = createRoot(node);
  const render = () => flushSync(() => root.render(<Screen />));
  render();
  return {
    ready: () => f.admission.getSnapshot().phase,
    modelPhase: () => model?.phase,
    information() {
      const actual = required(model);
      return {
        schemaEnabled:
          f.D.native.controllerDefinition.schema.pagination.enabled,
        nativeEnabled: f.D.native.paginationEnabled,
        viewEnabled: actual.view?.pagination.enabled,
        sourceMode: actual.metadata?.mode,
        displayedRows: actual.view?.rows.length,
        pageIndex: f.C.getSnapshot().query.pagination.pageIndex,
        pageSize: f.C.getSnapshot().query.pagination.pageSize,
        appKeys: Object.keys(f.metadata()),
      };
    },
    begin() {
      const actual = required(model);
      const origin = f.admission.capture(required(lease));
      const result = f.admission.begin(origin, {
        movedId: "one",
        beforeId: "three",
        afterId: "two",
      });
      if (result.status !== "started")
        throw new Error("Actual started extent operation required");
      operation = result.operation;
      return {
        status: result.status,
        extent: operation.origin.extent ?? "page",
        ownExtent: Object.hasOwn(operation.origin, "extent"),
        pageIndex: operation.origin.pageIndex,
        pageSize: operation.origin.pageSize,
        ids: operation.move.pageIds,
        actualIds: actual.view?.rows.map((row) => row.id),
        actualC:
          requireReorderAdmission(f.admission, f.D, f.C).controller === f.C,
      };
    },
    acknowledge() {
      const token = required(operation);
      f.admission.settle(token, {
        kind: "accepted",
        revision: "transport-only",
      });
      const waiting = f.admission.getSnapshot().moves.pending?.phase;
      app.publishAuthoritativeOrder();
      render();
      const actual = required(model),
        metadata = f.metadata();
      const state = f.C.getSnapshot();
      const stamp = {
        ownerEpoch: metadata.ownerEpoch,
        sourceVersion: metadata.sourceVersion,
        revision: metadata.revision,
        definitionKey: f.context.definitionKey,
        scopeKey: f.context.scopeKey,
        queryIdentity: state.queryIdentity,
        pageIndex: state.query.pagination.pageIndex,
        pageSize: state.query.pagination.pageSize,
      };
      f.admission.acknowledge(token, { stamp, disposition: "applied" });
      const omittedCannotSettle =
        f.admission.getSnapshot().moves.pending?.operation === token;
      f.admission.acknowledge(token, {
        stamp: { ...stamp, extent: "complete" },
        disposition: "applied",
      });
      return {
        waiting,
        omittedCannotSettle,
        pending: f.admission.getSnapshot().moves.pending === null,
        feedback: f.admission.getSnapshot().moves.feedback?.code,
        actualIds: actual.view?.rows.map((row) => row.id),
        failures,
      };
    },
    denyBegin() {
      let denied = false;
      try {
        f.admission.capture(required(lease));
      } catch {
        denied = true;
      }
      return { denied, actualModelPhase: required(model).phase };
    },
    dispose() {
      flushSync(() => root.unmount());
      node.remove();
      app.dispose();
    },
  };
}
