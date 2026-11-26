import "../../../packages/heroui/src/styles.css";
import { createFixture, mountDirect, mountDataTable } from "./fixtures.js";
import {
  getTableReorderingBinding,
  projectTableReordering,
  requireCollectionReordering,
  collectionRowRef,
  rowCollectionRefs,
  leafCollectionRefs,
  reorderingSnapshot,
  subscribeReordering,
} from "../../../packages/heroui/src/table/reordering-binding.js";
import { requireTableRendererTarget } from "../../../packages/heroui/src/table/renderer-commit.js";
import { ControlledCollection } from "../../../packages/heroui/src/table/controlled-collection.js";
import { RowMoveControls } from "../../../packages/heroui/src/table/reordering-controls.js";
let direct = mountDirect(),
  full: ReturnType<typeof mountDataTable> | null = null;
type Cut =
  | "update"
  | "replace"
  | "failed"
  | "null"
  | "cleanup"
  | "metadata"
  | "stale";
let savedNavigation: (() => void) | null = null;
const api = {
  reset(
    remote = false,
    unpaged = true,
    rows = true,
    arabic = false,
    grouped = false,
  ) {
    direct.dispose();
    full?.dispose();
    full = null;
    const f = createFixture({ remote, unpaged, rows, grouped });
    if (remote) f.start();
    direct = mountDirect(f);
    if (arabic)
      full = mountDataTable(createFixture({ unpaged, rows, grouped }), true);
  },
  full() {
    full?.dispose();
    full = mountDataTable(createFixture());
    full.container.dataset.probe = "shell";
  },
  remoteFull() {
    full?.dispose();
    const f = createFixture({ remote: true, unpaged: true });
    f.start();
    full = mountDataTable(f);
    full.container.dataset.probe = "remote";
  },
  completeFull() {
    if (!full) throw Error("Actual shell required");
    full.f.succeed();
    full.render();
  },
  waitFull() {
    if (!full) throw Error("Actual shell required");
    full.f.start();
    full.render();
  },
  fullInformation() {
    if (!full) throw Error("Actual shell required");
    return {
      phase: full.model()?.phase,
      notifications: full.f.counts.notifications,
      appPhase: full.f.helper?.admission.getSnapshot().phase,
      pending:
        (full.f.helper?.admission.getSnapshot().moves.pending ?? null) !== null,
    };
  },
  status: () => direct.status(),
  counts: () => ({ ...direct.f.counts }),
  information() {
    return {
      status: direct.status(),
      sameReceiver: direct.f.receiverMatches(),
      operation: direct.f.operation()?.move,
      pending: direct.f.helper?.admission.getSnapshot().moves.pending?.phase,
      phase: direct.f.helper?.admission.getSnapshot().phase,
      trace: [...direct.f.trace],
      columnHelper: direct.f.helper === null,
      revision: direct.f.C.getSnapshot().revision,
    };
  },
  arm(kind: Cut) {
    if (kind === "cleanup") direct.saveCleanup();
    let fired = false;
    direct.f.setEligibilityHook(() => {
      if (fired) return true;
      fired = true;
      const cut = () => {
        direct.f.trace.push(`cut:${kind}`);
        if (kind === "replace") {
          direct.replace(false, true);
          direct.f.trace.push("B-committed");
        } else if (kind === "failed") {
          try {
            direct.replace(true, true);
          } catch {
            /* Genuine failed replacement, no substitute. */
          }
        } else if (kind === "null") direct.detachRow();
        else if (kind === "cleanup" || kind === "stale") direct.staleCleanup();
        else direct.update();
      };
      if (kind === "metadata")
        direct.f.setMetadataHook(() => {
          direct.f.setMetadataHook(null);
          cut();
        });
      else cut();
      return true;
    });
  },
  notify(
    mode: "throw" | "reject" | "detach" | "query" | "selection" | "focus",
  ) {
    direct.f.setNotify(() => {
      if (mode === "throw")
        throw Error("Synthetic app-owned notification failure");
      if (mode === "reject")
        return Promise.reject(Error("Synthetic owned rejection"));
      if (mode === "detach") direct.disconnect();
      if (mode === "query")
        direct.f.C.dispatch({
          type: "search.commit",
          search: "Record",
        });
      if (mode === "focus") document.getElementById("outside")?.focus();
      if (mode === "selection")
        direct.f.C.dispatch({
          type: "selection.change",
          update: { "row-0": true },
        });
      return undefined;
    });
  },
  rejectEligible() {
    direct.f.setEligibilityHook((row) => row.id !== "row-1");
  },
  detach() {
    return direct.detachRow();
  },
  p2Reject: () => direct.p2Reject(),
  saveThenRetire() {
    direct.saveCleanup();
    direct.detachRow();
    direct.render();
  },
  saveNavigation() {
    savedNavigation = direct.navigation(1);
  },
  runSavedNavigation() {
    let denied = false;
    try {
      savedNavigation?.();
    } catch {
      denied = true;
    }
    return { denied, revision: direct.f.C.getSnapshot().revision };
  },
  publishApplied() {
    direct.f.publishAppliedSource();
    direct.render();
  },
  acknowledgeApplied() {
    const model = direct.requireTarget().model,
      op = direct.f.operation(),
      helper = direct.f.helper;
    if (!model.view || !model.metadata || !op || !helper)
      throw Error("Actual new-source model and transferred operation required");
    const state = model.view.state,
      context = model.metadata.origin.context;
    return helper.admission.acknowledge(op, {
      disposition: "applied",
      stamp: {
        ownerEpoch: direct.f.metadata.ownerEpoch,
        sourceVersion: direct.f.metadata.sourceVersion,
        revision: direct.f.metadata.revision,
        definitionKey: context.definitionKey,
        scopeKey: context.scopeKey,
        queryIdentity: state.queryIdentity,
        ...state.query.pagination,
        ...(direct.f.schema.pagination.enabled === false
          ? { extent: "complete" as const }
          : {}),
      },
    });
  },
  render() {
    direct.render();
  },
  start() {
    direct.f.start();
    direct.render();
  },
  succeed() {
    direct.f.succeed();
    direct.render();
  },
  settle(kind: "accepted" | "indeterminate" | "rejected") {
    const op = direct.f.operation(),
      admission = direct.f.helper?.admission;
    if (!op || !admission)
      throw Error("Actual transferred app operation required");
    return admission.settle(
      op,
      kind === "accepted"
        ? { kind, revision: "1" }
        : kind === "indeterminate"
          ? { kind, code: "timeout" }
          : { kind, code: "rejected" },
    );
  },
  coercion(intent: "index" | "size" = "index") {
    const revision = direct.f.C.getSnapshot().revision;
    let coerced = 0;
    const event = direct.navigation(
      {
        valueOf() {
          coerced++;
          direct.replace();
          return intent === "size" ? 25 : 1;
        },
      },
      intent,
    );
    let denied = false;
    try {
      event();
    } catch {
      denied = true;
    }
    return {
      denied,
      coerced,
      sameRevision: revision === direct.f.C.getSnapshot().revision,
    };
  },
  observerClear() {
    const value = direct.requireTarget(),
      binding = getTableReorderingBinding(value.target),
      view = requireTableRendererTarget(value.target).model.view;
    if (!binding || !view)
      throw Error("Genuine ready native projection required");
    // This inspection projection is built only from actual registered members;
    // it is not an allowing cap/model or a second application row processor.
    const columns = Object.freeze(
      view.visibleColumns.map((column) =>
        Object.freeze({
          kind: "leaf" as const,
          id: column.id,
          label: column.id,
          textValue: column.id,
          isRowHeader: column.id === "title",
        }),
      ),
    );
    const rows = Object.freeze(
      view.rows.map((row) =>
        Object.freeze({
          id: row.id,
          textValue: row.id,
          cells: Object.freeze(
            Object.fromEntries(
              row
                .getVisibleCells()
                .map((cell) => [
                  cell.column.id,
                  Object.freeze({ textValue: cell.column.id, content: null }),
                ]),
            ),
          ),
        }),
      ),
    );
    const token = projectTableReordering(binding, columns, rows),
      presentation = requireCollectionReordering(token, columns, rows);
    const before = {
      row: !!collectionRowRef(presentation, "row-0"),
      handle: !!rowCollectionRefs(presentation, "row-0"),
      leaf: !!leafCollectionRefs(presentation, "title"),
    };
    const observed: {
      actorNull: boolean;
      disabled: boolean;
      rowEmpty: boolean;
      handleEmpty: boolean;
      leafEmpty: boolean;
    }[] = [];
    const stop = subscribeReordering(binding, () =>
      observed.push({
        actorNull: value.cell.getSnapshot().actor === null,
        disabled: !reorderingSnapshot(binding).ready,
        rowEmpty: collectionRowRef(presentation, "row-0") === undefined,
        handleEmpty: rowCollectionRefs(presentation, "row-0") === null,
        leafEmpty: leafCollectionRefs(presentation, "title") === null,
      }),
    );
    value.cell.disconnect(value.lease);
    stop();
    let lateReads = 0;
    const poison = () => {
      lateReads++;
      throw Error("Ended private projection port");
    };
    const denied =
      Reflect.apply(ControlledCollection, undefined, [
        {
          reordering: token,
          get columns() {
            return poison();
          },
          get rows() {
            return poison();
          },
        },
      ]) === null;
    Reflect.apply(RowMoveControls, undefined, [
      {
        collection: presentation,
        get id() {
          return poison();
        },
        get messages() {
          return poison();
        },
      },
    ]);
    return {
      before,
      observed,
      denied,
      lateReads,
      late:
        collectionRowRef(presentation, "row-0") === undefined &&
        rowCollectionRefs(presentation, "row-0") === null &&
        leafCollectionRefs(presentation, "title") === null,
    };
  },
};
declare global {
  interface Window {
    pretokenRenderer: typeof api;
  }
}
window.pretokenRenderer = api;
export type BrowserAPI = typeof api;
