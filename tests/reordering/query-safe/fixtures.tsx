/// <reference path="../neutral-consumer/styles.d.ts" />
import "@tableweave/heroui/styles.css";
import { useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { DataTable } from "../../../packages/heroui/src/data-table/data-table.js";
import { englishDataTableLocale } from "../../../packages/heroui/src/localization/data-table.js";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import { createCriteriaPublication } from "../../../packages/react/src/controller/criteria-publication.js";
import type { TableCommand } from "../../../packages/react/src/controller/types.js";
import type { CriteriaFrames } from "../../../packages/react/src/presentation/criteria-frame.js";
import { gap } from "../../../packages/react/src/reordering/capture.js";
import type {
  RowMoveAcknowledgement,
  RowMoveOperation,
  RowMoveSettlement,
} from "../../../packages/react/src/reordering/types.js";
import {
  captureReorderNavigation,
  claimReorderUI,
  joinReorderModel,
  observeReorderUI,
  releaseReorderUI,
  requireReorderNavigation,
  revokeReorderInteraction,
} from "../../../packages/react/src/reordering-controller/admission.js";
import { createReorderController } from "../../../packages/react/src/reordering-controller/controller.js";
import type { ReorderApplicationMetadata } from "../../../packages/react/src/reordering-controller/types.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import type { DataTableModel } from "../../../packages/react/src/table/types.js";
import {
  requireDataTableModel,
  useDataTable,
} from "../../../packages/react/src/table/use-data-table.js";

interface Item {
  readonly id: string;
  readonly amount: number;
}
const placement = { movedId: "one", beforeId: "three", afterId: "two" };
function required<V>(value: V | null | undefined): V {
  if (value == null)
    throw new Error("Expected genuine query-safe fixture value");
  return value;
}
function denied(action: () => unknown) {
  try {
    action();
    return false;
  } catch {
    return true;
  }
}

/** Synthetic APP authority observations, never backend persistence proof. All
 * positive table/move grants come from actual React/C/P/native/admission models.
 * Main supplies Vite/source aliases and executes this fixture; no server here. */
export function mountQuerySafeFixture(renderer = false, rtl = false) {
  const schema = defineQuerySchema({
    id: "query-safe-synthetic",
    version: 1,
    fields: { amount: { type: "number", owner: "builder", sort: true } },
    pagination: { defaultSize: 10, sizes: [10, 25] },
  });
  const D = defineTable<Item>()({
    schema,
    selection: false,
    reordering: { rows: true },
    getRowId: (record) => record.id,
    columns: [{ id: "amount", accessorKey: "amount", header: "Amount" }],
  });
  type S = typeof schema;
  type Model = DataTableModel<S, Item>;
  const initialInput: readonly Item[] = [
    { id: "one", amount: 1 },
    { id: "two", amount: 2 },
    { id: "three", amount: 3 },
  ];
  let input: readonly Item[] = [];
  let sourceLive = false;
  let metadata: ReorderApplicationMetadata = Object.freeze({
    ownerEpoch: 0,
    sourceVersion: 0,
    revision: 0,
    baseRevision: "0",
  });
  let movable: (() => void) | null = null;
  let metadataCallback: (() => void) | null = null;
  let notification: "normal" | "throw" | "query" = "normal";
  let operation: RowMoveOperation | null = null;
  let issuingEpoch: string | number | null = null;
  let deliveries = 0;
  let eligibilityCalls = 0;
  const settings = {
    instanceId: "query-safe-app",
    readCurrent() {
      if (this !== settings) throw new Error("Metadata receiver changed");
      metadataCallback?.();
      return metadata;
    },
    isRowMovable() {
      if (this !== settings) throw new Error("Movable receiver changed");
      eligibilityCalls++;
      movable?.();
      return true;
    },
    controller: {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
      onQueryChange(this: unknown) {
        if (this !== undefined) throw new Error("Query receiver changed");
        // Query publication is NOT an authoritative input observation.
        metadata = Object.freeze({
          ...metadata,
          ownerEpoch: metadata.ownerEpoch + 1,
        });
      },
    },
  };
  const { controller: C, admission } = createReorderController(D, settings);
  const lease = admission.mount();
  const context = {
    definitionKey: schema.id,
    scopeKey: "synthetic-same-label",
    access: true,
  };
  function retireApplication() {
    // Every transition actually retires private inputs and source availability.
    // A source/transport token is not a certificate that this work happened.
    input = [];
    sourceLive = false;
    if (!C.isDisposed()) {
      C.dispatch({ type: "selection.cancel" });
      C.dispatch({ type: "details.change", update: { rowId: null } });
    }
    return undefined;
  }
  const P = createCriteriaPublication({
    controller: C,
    definition: C.getDefinition(),
    retirement: { retire: retireApplication },
  });
  const begun = P.begin({
    controller: C,
    definition: C.getDefinition(),
    expected: context,
    actual: context,
  });
  if (
    begun.status !== "pending" ||
    P.complete(begun.ticket).status !== "settled"
  )
    throw new Error("Actual P settlement required");
  // Acquire synthetic authoritative INPUT only after real retirement/settlement.
  input = initialInput;
  sourceLive = true;
  const first = required(P.getSnapshot().current);
  const criteria = P.issue({
    controller: C,
    definition: C.getDefinition(),
    context: first.expected,
    epoch: first.epoch,
  });
  let sourceReadCallback: (() => void) | null = null;
  let lateCandidateFailures = 0;
  // A real application context, intentionally not the owner's fast-path identity.
  // Negative cases may throw from its original live descriptor reads.
  const sourceContext = new Proxy(
    { ...criteria.require().context },
    {
      getOwnPropertyDescriptor(target, key) {
        sourceReadCallback?.();
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    },
  );
  function options() {
    return {
      controller: C,
      publication: P,
      criteria,
      expected: context,
      source: {
        mode: "client" as const,
        context: sourceLive
          ? sourceContext
          : { ...sourceContext, access: false },
        records: input,
      },
      manualOrder: true,
    };
  }
  const errors: string[] = [];
  let actual: Model | null = null;
  let staged: { model: Model; lease: typeof lease } | null = null;
  let shown = true;
  function remember(token: RowMoveOperation) {
    // App correlation is retained BEFORE changed/user callbacks, outside the UI.
    operation = token;
    issuingEpoch = required(P.getSnapshot().current).epoch;
  }
  const rowConfig = {
    admission,
    lease,
    handleColumnId: "amount",
    onSubmit(token: RowMoveOperation) {
      remember(token);
      deliveries++;
      if (notification === "query")
        C.dispatch({
          type: "sorting.change",
          update: [{ id: "amount", desc: true }],
        });
      if (notification === "throw")
        throw new Error("Synthetic notification failure after handoff");
    },
  };
  function Source() {
    const actualInput = input;
    const actualMetadata = metadata;
    const model = useDataTable(D, options());
    actual = model;
    const [pair, setPair] = useState<typeof staged>(null);
    useLayoutEffect(() => {
      try {
        requireDataTableModel(model, D);
        if (
          model.phase !== "display" ||
          !model.authority ||
          !model.view ||
          !model.frame ||
          !model.sourceTarget ||
          !model.toolTarget
        )
          return;
        const facts = model.authority.read();
        requireDataTableModel(model, D);
        if (
          input !== actualInput ||
          metadata !== actualMetadata ||
          C.getSnapshot() !== model.state ||
          !facts.displayed ||
          facts.requestedQuery !== model.state?.query
        )
          return;
        // A genuine sorted/filtered DISPLAY is committed, never promoted to ACT.
        admission.commitModel(lease, model);
        const exact = { model, lease };
        staged = exact;
        setPair((previous) =>
          previous?.model === model && previous.lease === lease
            ? previous
            : exact,
        );
      } catch (error) {
        errors.push(error instanceof Error ? error.name : "unavailable");
      }
    }, [model, actualInput, actualMetadata]);
    return pair &&
      pair.model === model &&
      pair.lease === lease &&
      shown &&
      renderer ? (
      <DataTable
        table={pair.model}
        collection={{
          label: "Query-safe rows",
          rowHeaderColumnId: "amount",
          rowTextValue: (row) => row.id,
          columnTextValue: (column) => column.id,
          cellTextValue: (cell) => String(cell.getValue()),
        }}
        locale={englishDataTableLocale}
        reordering={{ rows: rowConfig }}
      />
    ) : (
      <output>Query-safe producer {admission.getSnapshot().phase}</output>
    );
  }
  const node = document.createElement("section");
  node.dir = rtl ? "rtl" : "ltr";
  document.body.append(node);
  const root = createRoot(node);
  let foreignRoot: ReturnType<typeof createRoot> | null = null;
  let foreignNode: HTMLElement | null = null;
  let foreignModel: Model | null = null;
  let disposed = false;
  const render = () => flushSync(() => root.render(<Source />));
  render();
  let binding: ReturnType<typeof claimReorderUI<S, Item>> | null = null;
  let joined: ReturnType<typeof joinReorderModel<S, Item>> | null = null;
  const uiOwner = Object.freeze({});
  function model() {
    return required(staged).model;
  }
  function stamp() {
    const state = C.getSnapshot();
    return {
      ownerEpoch: metadata.ownerEpoch,
      sourceVersion: metadata.sourceVersion,
      revision: metadata.revision,
      definitionKey: context.definitionKey,
      scopeKey: context.scopeKey,
      queryIdentity: state.queryIdentity,
      pageIndex: state.query.pagination.pageIndex,
      pageSize: state.query.pagination.pageSize,
    };
  }
  const acknowledgement = (
    disposition: RowMoveAcknowledgement["disposition"] = "applied",
  ) => ({ stamp: stamp(), disposition });
  function dispatch(command: TableCommand<S>) {
    const result = C.dispatch(command);
    render();
    return result.status;
  }
  return {
    admission,
    C,
    P,
    D,
    lease,
    render,
    model,
    operation: () => required(operation),
    information() {
      const snapshot = admission.getSnapshot();
      let canReorder: boolean | null = null;
      let rows: string[] | null = null;
      try {
        canReorder = required(actual).authority?.read().canReorder ?? null;
        rows = staged?.model.view?.rows.map((row) => row.id) ?? null;
      } catch {
        // Invalidated model observations are explicitly unavailable, not an
        // authorized empty page. App-owned retirement state remains observable.
      }
      return {
        phase: snapshot.phase,
        readmissionRequired: snapshot.readmissionRequired,
        pending: snapshot.moves.pending !== null,
        pendingId: snapshot.moves.pending?.operation.move.operationId ?? null,
        pendingPhase: snapshot.moves.pending?.phase ?? null,
        feedback: snapshot.moves.feedback,
        metadata,
        query: C.getSnapshot().queryIdentity,
        inputIds: input.map((row) => row.id),
        rows,
        staged: staged?.model === actual && staged?.lease === lease,
        deliveries,
        eligibilityCalls,
        canReorder,
        sourceLive,
        lateCandidateFailures,
        errors: [...errors],
      };
    },
    start() {
      const result = admission.begin(admission.capture(lease), placement);
      if (result.status === "started") remember(result.operation);
      return result.status;
    },
    startAtEnd() {
      const rows = required(required(actual).view).rows;
      const result = admission.begin(admission.capture(lease), {
        movedId: required(rows[0]).id,
        beforeId: null,
        afterId: required(rows.at(-1)).id,
      });
      if (result.status === "started") remember(result.operation);
      return result.status;
    },
    query(
      kind: "sort" | "clear-sort" | "filter" | "clear-filter" | "neutral-any",
    ) {
      if (kind === "sort")
        return dispatch({
          type: "sorting.change",
          update: [{ id: "amount", desc: true }],
        });
      if (kind === "clear-sort")
        return dispatch({ type: "sorting.change", update: [] });
      if (kind === "filter")
        return dispatch({
          type: "builder.commit",
          rule: {
            id: "gte",
            field: "amount",
            operator: "number.gte",
            value: 2,
          },
        });
      if (kind === "neutral-any")
        return dispatch({ type: "builder.join", join: "or" });
      return dispatch({ type: "builder.clear" });
    },
    settle(outcome: RowMoveSettlement) {
      return admission.settle(required(operation), outcome);
    },
    ackRetired(
      disposition: RowMoveAcknowledgement["disposition"] = "applied",
      overrides: Partial<RowMoveAcknowledgement["stamp"]> = {},
    ) {
      return admission.reconcileRetired(required(operation), {
        stamp: { ...stamp(), ...overrides },
        disposition,
      });
    },
    ackActive() {
      return admission.acknowledge(required(operation), acknowledgement());
    },
    /** Explicit synthetic token-correlated authority, never array-equality inference.
     * Applies intent to LATEST input only; a base/anchor conflict produces no ack. */
    authority(disposition: RowMoveAcknowledgement["disposition"]) {
      const token = required(operation);
      if (
        !sourceLive ||
        P.getSnapshot().current?.epoch !== issuingEpoch ||
        C.isDisposed()
      )
        return false;
      if (disposition === "applied") {
        if (metadata.baseRevision !== token.move.baseRevision) return false;
        const index = gap(
          input.map((row) => row.id),
          token.move,
        );
        const moved = input.find((row) => row.id === token.move.movedId);
        if (typeof index !== "number" || !moved) return false;
        const latest = input.filter((row) => row.id !== moved.id);
        input = [...latest.slice(0, index), moved, ...latest.slice(index)];
        const revision = metadata.sourceVersion + 1;
        metadata = Object.freeze({
          ...metadata,
          revision,
          baseRevision: String(revision),
          sourceVersion: metadata.sourceVersion + 1,
        });
      } else
        metadata = Object.freeze({
          ...metadata,
          sourceVersion: metadata.sourceVersion + 1,
        });
      render();
      return true;
    },
    competingInput() {
      input = input.filter((row) => row.id !== "two");
      metadata = Object.freeze({
        ...metadata,
        sourceVersion: metadata.sourceVersion + 1,
        revision: "competing",
        baseRevision: "competing",
      });
      render();
    },
    setMetadata(value: ReorderApplicationMetadata) {
      metadata = value;
      render();
    },
    metadataFailure() {
      metadataCallback = () => {
        throw new Error("Synthetic metadata read failure");
      };
    },
    clearMetadataFailure() {
      metadataCallback = null;
    },
    sameEpochCommitDenied() {
      return denied(() => admission.commitModel(lease, required(actual)));
    },
    lateCandidateFailure() {
      sourceReadCallback = () => {
        // Source-only fault targeting: requireCandidate/initial authentication
        // must succeed, then the ACTUAL checkModel source read throws. Stack
        // inspection supplies no model/capability or permission to the library.
        if (new Error().stack?.includes("checkModel")) {
          sourceReadCallback = null;
          lateCandidateFailures++;
          throw new Error("Synthetic late candidate source read failure");
        }
      };
    },
    unversionedInput() {
      // Intentionally INVALID authority publication. The native input/model is
      // genuine, but its different page IDs have no new app authority version.
      input = [required(input[1]), required(input[0]), required(input[2])];
      render();
    },
    readmit() {
      if (!admission.getSnapshot().readmissionRequired)
        throw new Error("No source readmission obligation");
      const value = required(actual),
        before = metadata,
        records = input,
        state = C.getSnapshot(),
        original = model();
      const check = () => {
        requireDataTableModel(value, D);
        criteria.require();
        if (
          !sourceLive ||
          input !== records ||
          metadata !== before ||
          C.getSnapshot() !== state ||
          value.state !== state ||
          value.sourceTarget?.owner !== original.sourceTarget?.owner ||
          value.toolTarget?.owner !== original.toolTarget?.owner ||
          value.metadata?.origin.epoch !== original.metadata?.origin.epoch
        )
          throw new Error("Source readmission proof changed");
      };
      check();
      const facts = required(value.authority).read();
      check();
      // This fixture's eligible three-record source fits its actual full page.
      // No displayed output is promoted to input or used as a replacement array.
      if (
        !facts.canReorder ||
        !facts.displayed ||
        facts.requestedQuery !== state.query ||
        facts.rows.length !== records.length ||
        records.length > state.query.pagination.pageSize
      )
        throw new Error("Source readmission needs the full eligible input");
      const ids = new Set<string>();
      for (let index = 0; index < records.length; index++) {
        check();
        const record = required(records[index]);
        let id: string;
        try {
          id = D.native.getRowId(record);
        } finally {
          check();
        }
        const row = facts.rows[index];
        if (!id || ids.has(id) || row?.id !== id || row.original !== record)
          throw new Error("Source readmission input mismatch");
        ids.add(id);
      }
      check();
      // An explicit coherent APP publication, not a query/C/P/backend event.
      metadata = Object.freeze({
        ...before,
        ownerEpoch: before.ownerEpoch + 1,
      });
      render();
    },
    failInsideObserve() {
      let reads = 0;
      metadataCallback = () => {
        if (++reads === 3) {
          metadataCallback = null;
          throw new Error("Synthetic pure observation read failure");
        }
      };
      try {
        return {
          result: admission.settle(required(operation), { kind: "accepted" }),
          reads,
        };
      } finally {
        metadataCallback = null;
      }
    },
    busySourceCapture() {
      const owner = required(model().sourceTarget).owner as CriteriaFrames<
        S,
        Item
      >;
      let callbacks = 0,
        captureDenied = false;
      // A negative callback vector inside an ACTUAL CriteriaFrames.prepare.
      // The proxy does not supply a substitute owner/capability or allowing flag.
      const source = new Proxy(options().source, {
        getOwnPropertyDescriptor(target, key) {
          if (key === "records") {
            callbacks++;
            captureDenied = denied(() => admission.capture(lease));
          }
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });
      owner.prepare({
        criteria,
        expected: context,
        source,
        nativeInput: { mode: "client", records: input },
        manualOrder: true,
      });
      return { callbacks, captureDenied, phase: owner.getSnapshot().phase };
    },
    departDuringObserve() {
      let reads = 0;
      metadataCallback = () => {
        // Empty-ID readFrame reads app metadata before/after. Its third read is
        // the pure observe AFTER the successful admission readiness preflight.
        if (++reads === 3) {
          metadataCallback = null;
          C.dispatch({
            type: "sorting.change",
            update: [{ id: "amount", desc: true }],
          });
        }
      };
      try {
        return {
          result: admission.settle(required(operation), { kind: "accepted" }),
          reads,
        };
      } finally {
        metadataCallback = null;
      }
    },
    join() {
      // Protocol actor only, not a fabricated native/model grant. UI tests below
      // separately use the actual DataTable renderer and captured onSubmit.
      binding = claimReorderUI(D, admission, lease, uiOwner);
      joined = joinReorderModel(binding, model(), Object.freeze({}));
      return observeReorderUI(binding);
    },
    gates() {
      const current = model();
      const navigation = joined ? captureReorderNavigation(joined) : null;
      return {
        uiPending: binding ? observeReorderUI(binding).pending : null,
        navigateDenied:
          navigation && joined
            ? denied(() =>
                requireReorderNavigation(navigation, required(joined), current),
              )
            : null,
        pagerDenied: denied(() =>
          C.dispatch({
            type: "pagination.change",
            update: { pageIndex: 1, pageSize: 10 },
          }),
        ),
        clampDenied: denied(() =>
          C.dispatch({
            type: "pagination.clamp",
            pageCount: 1,
            queryIdentity: C.getSnapshot().queryIdentity,
          }),
        ),
        move: admission.begin(admission.capture(lease), placement),
      };
    },
    releaseUI() {
      if (binding) releaseReorderUI(binding);
      binding = null;
      joined = null;
    },
    blockedBeforeToken() {
      const handle = admission.capture(lease);
      movable = () => {
        revokeReorderInteraction(handle);
      };
      try {
        return admission.begin(handle, placement);
      } finally {
        movable = null;
      }
    },
    noopBeforeToken() {
      return admission.begin(admission.capture(lease), {
        movedId: "one",
        beforeId: "two",
        afterId: null,
      });
    },
    foreignSource() {
      if (foreignRoot) return;
      foreignNode = document.createElement("section");
      document.body.append(foreignNode);
      foreignRoot = createRoot(foreignNode);
      function Foreign() {
        const value = useDataTable(D, options());
        foreignModel = value;
        return null;
      }
      flushSync(() => required(foreignRoot).render(<Foreign />));
    },
    foreignReady() {
      return !denied(() => {
        const value = required(foreignModel);
        requireDataTableModel(value, D);
        if (value.phase !== "display") throw new Error("Not a display yet");
      });
    },
    foreignCommitDenied() {
      return denied(() => admission.commitModel(lease, required(foreignModel)));
    },
    closeSourceOwner() {
      const owner = required(model().sourceTarget).owner as CriteriaFrames<
        S,
        Item
      >;
      owner.close();
    },
    hostileUnknown(proxyToken = false) {
      const token = required(operation);
      let touches = 0;
      const foreign = proxyToken
        ? new Proxy(token, {
            get() {
              touches++;
              throw new Error("No foreign token reads");
            },
          })
        : { ...token };
      const payload = new Proxy(
        {},
        {
          getPrototypeOf() {
            touches++;
            throw new Error("No foreign payload reads");
          },
        },
      );
      return {
        settle: Reflect.apply(admission.settle, admission, [foreign, payload]),
        acknowledge: Reflect.apply(admission.acknowledge, admission, [
          foreign,
          payload,
        ]),
        retired: Reflect.apply(admission.reconcileRetired, admission, [
          foreign,
          payload,
        ]),
        touches,
      };
    },
    malformed() {
      let getters = 0;
      const payload = Object.defineProperty({}, "kind", {
        enumerable: true,
        get() {
          getters++;
          return "accepted";
        },
      });
      return {
        result: Reflect.apply(admission.settle, admission, [
          required(operation),
          payload,
        ]),
        getters,
      };
    },
    revokeDuringPayload() {
      const fields: PropertyKey[] = [];
      const payload = new Proxy(
        { kind: "accepted" as const, revision: "transport" },
        {
          getOwnPropertyDescriptor(target, key) {
            fields.push(key);
            admission.advance("source");
            return Reflect.getOwnPropertyDescriptor(target, key);
          },
        },
      );
      return { result: admission.settle(required(operation), payload), fields };
    },
    reenterDuringPayload() {
      let nested: ReturnType<typeof admission.settle> | null = null;
      const payload = new Proxy(
        { kind: "accepted" as const },
        {
          getOwnPropertyDescriptor(target, key) {
            nested = admission.settle(required(operation), {
              kind: "rejected",
              code: "conflict",
            });
            return Reflect.getOwnPropertyDescriptor(target, key);
          },
        },
      );
      return { outer: admission.settle(required(operation), payload), nested };
    },
    end(kind: "disconnect" | "advance" | "publication" | "controller") {
      if (kind === "disconnect") admission.disconnect(lease);
      if (kind === "advance") admission.advance("source");
      if (kind === "controller") {
        retireApplication();
        C.dispose();
      }
      if (kind === "publication") {
        const change = P.begin({
          controller: C,
          definition: C.getDefinition(),
          expected: context,
          actual: context,
        });
        if (
          change.status !== "pending" ||
          P.complete(change.ticket).status !== "settled"
        )
          throw new Error(
            "Application publication retirement did not complete",
          );
      }
      return admission.getSnapshot().phase;
    },
    remountDenied() {
      return denied(() => admission.mount());
    },
    notification(value: typeof notification) {
      notification = value;
    },
    hide() {
      shown = false;
      render();
    },
    show() {
      shown = true;
      render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      flushSync(() => {
        foreignRoot?.unmount();
        root.unmount();
      });
      foreignNode?.remove();
      node.remove();
      // Retire app inputs while its actual controller/admission are still live.
      const result = P.dispose();
      admission.dispose();
      C.dispose();
      if (result.status !== "disposed")
        throw new Error("Application publication retirement did not complete");
    },
  };
}
export type QuerySafeFixture = ReturnType<typeof mountQuerySafeFixture>;
