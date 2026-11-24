import type { QuerySchema } from "../../../packages/react/src/contracts/types.js";
import {
  type CriteriaPublication,
  type CriteriaPublicationEvent,
  type CriteriaPublicationTicket,
  createCriteriaPublication,
} from "../../../packages/react/src/controller/criteria-publication.js";
import type {
  MutationResult,
  StateProposal,
  StateSeed,
  TableCommand,
  TableController,
} from "../../../packages/react/src/controller/types.js";
import type { ResourceContext } from "../../../packages/react/src/resource/types.js";
import type { TableDefinition } from "../../../packages/react/src/table/types.js";

/** Application fixture, not a C wrapper: the actual P1 factory object is retained.
 * Bootstrap certifies its constructor snapshot AND any owned pending receipt. */
export class ApplicationOwner<S extends QuerySchema, T extends object> {
  readonly C: TableController<S>;
  readonly CD;
  readonly P: CriteriaPublication<S>;
  pending: StateProposal<S> | null = null;
  readonly counts = { request: 0, commit: 0, retire: 0, reset: 0 };
  #ticket: CriteriaPublicationTicket<S> | null = null;
  #certificate: {
    snapshot: ReturnType<TableController<S>["getSnapshot"]>;
    pending: StateProposal<S> | null;
    candidate: object;
  } | null = null;
  #retiring = false;
  #initial = true;
  constructor(
    readonly D: TableDefinition<S, T>,
    readonly context: ResourceContext,
    initial: StateSeed<S>,
    now: () => number,
  ) {
    this.C = D.createController({
      initial,
      now,
      controlled: ["query", "selection", "columns", "details"],
      onRequest: () => {
        this.counts.request++;
      },
      onCommit: () => {
        this.counts.commit++;
      },
    });
    this.CD = this.C.getDefinition();
    this.P = createCriteriaPublication({
      controller: this.C,
      definition: this.CD,
      retirement: { retire: (event) => this.#retire(event) },
    });
  }
  #record(result: MutationResult<S>) {
    this.pending = result.status === "proposed" ? result.proposal : null;
    return result;
  }
  propose(command: TableCommand<S>) {
    return this.#record(this.C.dispatch(command));
  }
  accept() {
    if (!this.pending) throw new Error("No exact owned proposal");
    return this.#record(this.C.accept(this.pending));
  }
  change(command: TableCommand<S>) {
    const result = this.propose(command);
    return result.status === "proposed" ? this.accept() : result;
  }
  prepare() {
    if (!this.#initial) throw new Error("No initial certificate");
    const snapshot = this.C.getSnapshot(),
      pending = this.pending;
    const result = this.P.begin({
      controller: this.C,
      definition: this.CD,
      expected: this.context,
      actual: this.context,
    });
    if (result.status !== "pending" || !result.snapshot.pending)
      throw new Error("No actual initial ticket");
    this.#ticket = result.ticket;
    this.#certificate = {
      snapshot,
      pending,
      candidate: result.snapshot.pending,
    };
    return result;
  }
  settle() {
    if (!this.#ticket) throw new Error("No initial ticket");
    const ticket = this.#ticket;
    try {
      return this.P.complete(ticket);
    } finally {
      this.#certificate = null;
      this.#ticket = null;
      this.#initial = false;
    }
  }
  criteria() {
    const current =
      this.P.getSnapshot().current ?? this.P.getSnapshot().pending;
    if (!current) throw new Error("No actual origin");
    return this.P.issue({
      controller: this.C,
      definition: this.CD,
      context: current.expected,
      epoch: current.epoch,
    });
  }
  reset() {
    this.#initial = false;
    this.#certificate = null;
    this.#retiring = true;
    const result = this.P.begin({
      controller: this.C,
      definition: this.CD,
      expected: this.context,
      actual: this.context,
    });
    if (result.status !== "pending") throw new Error("No reset ticket");
    return result;
  }
  #retire(event: CriteriaPublicationEvent<S>): undefined {
    this.counts.retire++;
    const cert = this.#certificate;
    if (cert) {
      if (
        !this.#initial ||
        !this.#ticket ||
        event.kind !== "transition" ||
        event.controller !== this.C ||
        event.definition !== this.CD ||
        event.next !== cert.candidate ||
        this.P.getSnapshot().pending !== cert.candidate ||
        this.C.getSnapshot() !== cert.snapshot ||
        this.pending !== cert.pending ||
        this.C.isDisposed()
      )
        throw new Error("Actual constructor/receipt certificate changed");
      this.#certificate = null;
      return undefined;
    }
    if (!this.#retiring) throw new Error("No certified adoption/retirement");
    if (this.pending) {
      this.C.reject(this.pending);
      this.pending = null;
    }
    const reset = this.propose({ type: "selection.cancel" });
    if (reset.status === "proposed") this.accept();
    if (this.pending || Object.keys(this.C.getSnapshot().selection).length)
      throw new Error("Retirement did not commit");
    this.counts.reset++;
    return undefined;
  }
}
