import type { DetailsAuthority } from "@tableweave/heroui";
import type { ResourceRequest, ResourceSuccess } from "@tableweave/react";
import type { QueryFor } from "@tableweave/react/contracts";
import type { OptionRequest } from "@tableweave/react/filters";
import type { ExampleDetails } from "../../../apps/examples/shared/details.js";
import type { ExampleOwner } from "../../../apps/examples/shared/owner.js";
import {
  receivedAt,
  type Transaction,
} from "../../../apps/examples/shared/records.js";
import type { TransactionSchema } from "../../../apps/examples/shared/schemas.js";
import { reviewSyntheticRow } from "../../../apps/examples/recipes/row-bulk-actions.js";
import type { RowMoveOperation } from "@tableweave/react/reordering";

export type Owner = ExampleOwner<TransactionSchema, Transaction>;
export type Driver = ExampleDetails<TransactionSchema, Transaction>;
export type Channel = "C" | "P" | "source" | "resource" | "options" | "details";

/** Application drafts are INPUT, not accepted query/native output. */
export function createDrafts() {
  let values: Readonly<Record<string, string>> = Object.freeze({});
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => values,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    edit(owner: Owner, id: string, value: string) {
      if (!owner.getSnapshot().access || !owner.record(id)) return;
      values = Object.freeze({ ...values, [id]: value });
      for (const listener of listeners) listener();
    },
    purge() {
      values = Object.freeze({});
      for (const listener of listeners) listener();
      return undefined;
    },
  };
}
export type Drafts = ReturnType<typeof createDrafts>;
export interface BufferCounts {
  readonly records: number;
  readonly retained: number;
  readonly rowPending: number;
  readonly optionLabels: number;
  readonly optionPending: number;
  readonly detailSource: number;
  readonly detailPending: number;
  readonly detailDrafts: number;
  readonly dirty: number;
  readonly decision: number;
  readonly selected: number;
  readonly target: number;
  readonly inlineDrafts: number;
  readonly requestBinding: number;
  readonly snapshotBinding: number;
  readonly movePending: number;
}
export interface Observation {
  readonly channel: Channel;
  readonly revoking: boolean;
  readonly counts: BufferCounts | null;
}
/** Bounded read-only subscription diagnostics. No authority, model or frame cache. */
export function createEvents(owner: Owner, driver: Driver, drafts: Drafts) {
  let revoking = false,
    errors = 0,
    overflow = 0,
    submissions = 0;
  const observations: Observation[] = [];
  const counts = (): BufferCounts => {
    const source = owner.getSnapshot(),
      state = owner.C.getSnapshot();
    const resource = owner.remote.resource.getSnapshot(),
      options = owner.numericOptions.source.getSnapshot();
    const detail = driver.getSnapshot(),
      binding = owner.remote.bindings();
    return {
      records: source.records.length,
      retained: resource.snapshot?.records.length ?? 0,
      rowPending: Number(resource.busy && resource.request !== null),
      optionLabels:
        options.selected.filter((option) => option.known).length +
        (options.page?.options.length ?? 0),
      optionPending: Number(options.busy && options.request !== null),
      detailSource: Number(detail.source !== null),
      detailPending: Number(detail.source?.status === "loading"),
      detailDrafts: Object.keys(detail.drafts).length,
      dirty: Number(detail.dirty),
      decision: Number(detail.decision !== null || detail.confirming),
      selected: Object.values(state.selection).filter(Boolean).length,
      target: Number(state.details.rowId !== null),
      inlineDrafts: Object.keys(drafts.getSnapshot()).length,
      requestBinding: Number(binding.request !== null),
      snapshotBinding: Number(binding.snapshot !== null),
      movePending: Number(
        owner.reorder?.admission.getSnapshot().moves.pending != null,
      ),
    };
  };
  function observe(channel: Channel) {
    if (observations.length >= 512) {
      overflow++;
      return;
    }
    try {
      observations.push({ channel, revoking, counts: counts() });
    } catch {
      errors++;
      observations.push({ channel, revoking, counts: null });
    }
  }

  // These envelopes belong to an uncancellable external synthetic transport queue.
  // They deliberately outlive the app to exercise rejected late callbacks. They are
  // not exposed by inspect(), app buffers, an accepted/native mirror or a new grant.
  let heldRow: {
    request: ResourceRequest<QueryFor<TransactionSchema>>;
    result: ResourceSuccess<Transaction>;
  } | null = null;
  let heldOption: {
    request: OptionRequest;
    options: readonly { id: number; label: string }[];
  } | null = null;
  let heldDetail: DetailsAuthority | null = null;
  let heldDecision: { authority: DetailsAuthority; ticket: object } | null =
    null;
  let heldAction: (() => void) | null = null;
  return {
    counts,
    inspect() {
      const operation = owner.reorder?.operation;
      const publication = owner.P.getSnapshot();
      return {
        observations: [...observations],
        errors,
        overflow,
        counts: counts(),
        phase: publication.phase,
        publicationFailure:
          publication.phase === "blocked" ? publication.failure : null,
        submissions,
        exactPendingOperation:
          !!operation &&
          owner.reorder?.admission.getSnapshot().moves.pending?.operation ===
            operation,
      };
    },
    submitted(_operation: RowMoveOperation) {
      // Count actual production notifications; never synthesize begin/accept/ack.
      submissions++;
    },
    connect() {
      const stops = [
        owner.C.subscribe(() => observe("C")),
        owner.P.subscribe({
          notify() {
            observe("P");
            return undefined;
          },
        }),
        owner.subscribe(() => observe("source")),
        owner.remote.resource.subscribe(() => observe("resource")),
        owner.numericOptions.source.subscribe(() => observe("options")),
        driver.subscribe(() => observe("details")),
      ];
      observe("source");
      return () => {
        for (const stop of stops) stop();
      };
    },
    revoke() {
      revoking = true;
      try {
        owner.revoke();
      } finally {
        revoking = false;
      }
    },
    captureRow() {
      const request = owner.remote.resource.getSnapshot().request;
      if (!request) return false;
      const query = request.query;
      // Capture a CORRECT neutral-page response from app INPUT at issuance. No
      // second evaluator or output cache. Other query shapes are not this control.
      if (
        query.search ||
        query.tabId !== null ||
        query.date !== null ||
        query.builder.rules.length ||
        query.sorting.length
      )
        return false;
      const records = owner.getSnapshot().records;
      const { pageIndex, pageSize } = query.pagination;
      heldRow = {
        request,
        result: {
          source: "fresh",
          records: records.slice(
            pageIndex * pageSize,
            (pageIndex + 1) * pageSize,
          ),
          page: { kind: "known", total: records.length },
          emptyKind: records.length ? "filtered" : "dataset",
          receivedAt,
        },
      };
      return true;
    },
    replayRow() {
      if (!heldRow) throw new Error("No captured row response");
      return {
        success: owner.remote.resource.succeed(heldRow.request, heldRow.result),
        failure: owner.remote.resource.fail(heldRow.request, "unavailable"),
      };
    },
    captureOptions() {
      const request = owner.numericOptions.source.getSnapshot().request;
      if (!request) return false;
      heldOption = {
        request,
        options: [0, 1, 2]
          .map((id) => ({ id, label: `Account ${["zero", "one", "two"][id]}` }))
          .filter((option) =>
            option.label
              .toLocaleLowerCase("en-US")
              .includes(request.term.toLocaleLowerCase("en-US")),
          ),
      };
      return true;
    },
    replayOptions() {
      if (!heldOption) throw new Error("No captured options response");
      return {
        success: owner.numericOptions.source.succeed(heldOption.request, {
          options: heldOption.options,
          hasMore: false,
        }),
        failure: owner.numericOptions.source.fail(
          heldOption.request,
          "unavailable",
        ),
      };
    },
    captureDetail() {
      const snapshot = driver.getSnapshot();
      if (snapshot.source?.status !== "loading") return false;
      heldDetail = snapshot.authority;
      return true;
    },
    replayDetail() {
      if (!heldDetail) throw new Error("No captured detail response");
      driver.respond(heldDetail, "ready");
      driver.respond(heldDetail, "error");
    },
    captureDecision() {
      const snapshot = driver.getSnapshot();
      if (!snapshot.decision) return false;
      heldDecision = {
        authority: snapshot.authority,
        ticket: snapshot.decision,
      };
      return true;
    },
    replayDecision() {
      if (!heldDecision) throw new Error("No captured dirty decision");
      driver.answer(heldDecision.authority, heldDecision.ticket, true);
    },
    captureAction(id: string) {
      if (!owner.record(id)) return false;
      heldAction = () => reviewSyntheticRow(owner, id);
      return true;
    },
    replayAction() {
      if (!heldAction) throw new Error("No captured row action");
      heldAction();
    },
  };
}
export type Events = ReturnType<typeof createEvents>;
