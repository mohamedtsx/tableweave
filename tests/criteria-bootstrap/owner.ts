import type { RowData } from "@tanstack/react-table";
import { canonicalJson } from "../../packages/react/src/contracts/json.js";
import type { QuerySchema } from "../../packages/react/src/contracts/types.js";
import type { CriteriaAuthority, CriteriaCurrent } from "../../packages/react/src/controller/criteria.js";
import { createCriteriaAuthority, requireCriteriaAuthority } from "../../packages/react/src/controller/criteria.js";
import type { CriteriaPublication, CriteriaPublicationEvent, CriteriaPublicationTicket } from "../../packages/react/src/controller/criteria-publication.js";
import { createCriteriaPublication } from "../../packages/react/src/controller/criteria-publication.js";
import type { ControllerDefinition, MutationResult, StateProposal, StateSeed, TableCommand, TableController, TableState } from "../../packages/react/src/controller/types.js";
import type { ResourceContext } from "../../packages/react/src/resource/types.js";
import { assertNativeController, createNativeController } from "../../packages/react/src/tanstack/definition.js";
import type { NativeDefinition } from "../../packages/react/src/tanstack/types.js";

interface Certificate<S extends QuerySchema> {
  readonly publication: CriteriaPublication<S>;
  readonly ticket: CriteriaPublicationTicket<S>;
  readonly candidate: CriteriaCurrent<S>;
  readonly incarnation: object;
  readonly snapshot: TableState<S>;
  readonly revision: number;
  readonly receipt: StateProposal<S> | null;
  readonly generation: number;
}
export interface OwnerInputs<S extends QuerySchema, T extends RowData> {
  readonly native: NativeDefinition<S, T>;
  readonly initial: StateSeed<S>;
  readonly context: ResourceContext;
  readonly now: () => number;
}
/** Application/request lifetime fixture; NOT a TableController implementation.
 * C remains the genuine frozen factory object. No accepted-state mirror exists.
 */
export class ApplicationOwner<S extends QuerySchema, T extends RowData> {
  readonly C: TableController<S>;
  readonly CD: ControllerDefinition<S>;
  readonly ND: NativeDefinition<S, T>;
  readonly P: CriteriaPublication<S>;
  readonly counts = { request: 0, commit: 0, query: 0, subscriber: 0, retire: 0, rejectAttempt: 0, reject: 0, clearDispatch: 0, clearAccept: 0, emptyAcknowledgement: 0, appCleanup: 0, notificationFailures: 0 };
  // Synthetic application failure controls, never producer method patches.
  readonly faults: {
    onRequest?: () => void;
    onCommit?: () => void;
    beforeRetire?: () => void;
    cleanup?: () => undefined;
    rejectClear?: boolean;
    proposedOnly?: boolean;
  } = {};
  appTransient: string | null = "synthetic-editor";
  #context: ResourceContext;
  #incarnation: object = Object.freeze({});
  #acceptedOrigin: object;
  #pending: StateProposal<S> | null = null;
  #pendingOrigin: object | null = null;
  #generation = 0;
  #depth = 0;
  #callbackDepth = 0;
  #portDepth = 0;
  #certificate: Certificate<S> | null = null;
  #initialAvailable = true;
  #initialAttempted = false;
  #retiring = false;
  #cleanupMode = false;
  #notificationDebt = false;

  private constructor(input: OwnerInputs<S, T>) {
    this.ND = input.native;
    this.#context = Object.freeze({ ...input.context });
    this.#acceptedOrigin = this.#incarnation;
    this.C = createNativeController(input.native, {
      initial: input.initial, now: input.now, controlled: ["query", "selection", "columns", "details"],
      validateCommand: (command) => {
        // Only bare-owner selection.cancel gets a lifecycle allowance. UI actors
        // still require their authority before dispatch, and native validation runs.
        if (this.#cleanupMode && command.type !== "selection.cancel") throw new Error("Lifecycle command denied");
        if (command.type === "selection.cancel" && this.faults.rejectClear) throw new Error("Synthetic reset refusal");
      },
      onRequest: () => {
        this.counts.request++;
        this.#callbackDepth++;
        try { this.faults.onRequest?.(); } finally { this.#callbackDepth--; }
        // Never record a pending receipt here. Dispatch may still reject.
      },
      onCommit: () => {
        this.counts.commit++;
        this.#callbackDepth++;
        try { this.faults.onCommit?.(); } finally { this.#callbackDepth--; }
      },
      onQueryChange: () => { this.counts.query++; },
    });
    this.CD = this.C.getDefinition();
    assertNativeController(this.ND, this.C);
    this.C.subscribe(() => { this.counts.subscriber++; });
    this.P = createCriteriaPublication({ controller: this.C, definition: this.CD, retirement: { retire: (event) => this.#retire(event) } });
  }
  static create<S extends QuerySchema, T extends RowData>(input: OwnerInputs<S, T>) { return new ApplicationOwner(input); }
  get incarnation(): object { return this.#incarnation; }
  get pending(): StateProposal<S> | null { return this.#pending; }
  get receiptGeneration(): number { return this.#generation; }
  get notificationDebt(): boolean { return this.#notificationDebt; }
  get context(): ResourceContext { return this.#context; }

  #safe(): void {
    if (this.#depth || this.#callbackDepth || this.#portDepth || this.C.isDisposed()) throw new Error("Unsafe owner boundary");
  }
  #record(result: MutationResult<S>): void {
    if (result.status === "proposed") {
      this.#pending = result.proposal;
      this.#pendingOrigin = this.#incarnation;
      this.#generation++;
    } else if (result.status === "committed" || result.status === "rejected") {
      this.#pending = null;
      this.#pendingOrigin = null;
      this.#generation++;
      if (result.status === "committed") {
        this.#acceptedOrigin = this.#incarnation;
        if (result.notificationFailures) this.#notificationDebt = true;
        this.counts.notificationFailures += result.notificationFailures;
      }
    }
  }
  /** Explicit application operation: reconcile the actual returned result. */
  propose(command: TableCommand<S>): MutationResult<S> {
    this.#safe();
    this.#depth++;
    try { const result = this.C.dispatch(command); this.#record(result); return result; }
    finally { this.#depth--; }
  }
  userPropose(authority: CriteriaAuthority<S>, command: TableCommand<S>): MutationResult<S> {
    const current = this.P.getSnapshot().current;
    if (!current) throw new Error("UI unavailable");
    requireCriteriaAuthority(authority, { controller: this.C, definition: this.CD, context: current.expected, epoch: current.epoch });
    return this.propose(command);
  }
  acceptPending(): MutationResult<S> {
    this.#safe();
    if (!this.#pending) throw new Error("No owned receipt");
    this.#depth++;
    try { const result = this.C.accept(this.#pending); this.#record(result); return result; }
    catch (error) {
      // The owned exact receipt's relative-clock expiry clears actual pending.
      // Other guard failures need explicit owner reject/retry, not guessed success.
      if (error instanceof Error && "code" in error && error.code === "state.stale") {
        this.#pending = null; this.#pendingOrigin = null;
      }
      throw error;
    }
    finally { this.#generation++; this.#depth--; }
  }
  rejectPending(): void {
    this.#safe();
    this.#reject();
  }
  #reject(): void {
    if (this.#pending) {
      this.counts.rejectAttempt++;
      this.C.reject(this.#pending); // actual old receipt FIRST; busy/disposed throw
      this.counts.reject++;
      this.#pending = null;
      this.#pendingOrigin = null;
      this.#generation++;
    }
  }
  #next(expected = this.#context, actual = this.#context) {
    return { controller: this.C, definition: this.CD, expected, actual };
  }
  #positive(): boolean {
    return this.#initialAvailable && !this.#retiring && !this.#notificationDebt &&
      this.#acceptedOrigin === this.#incarnation &&
      (!this.#pending || this.#pendingOrigin === this.#incarnation) &&
      this.#context.access && !this.#depth && !this.#callbackDepth && !this.C.isDisposed();
  }
  /** Begin outside callbacks; retain only an ephemeral snapshot around this proof. */
  prepareInitial(expected = this.#context, actual = this.#context) {
    this.#safe();
    if (!this.#positive() || this.#initialAttempted) throw new Error("Initial provenance unavailable");
    this.#initialAttempted = true;
    this.#certificate = null;
    const snapshot = this.C.getSnapshot(), generation = this.#generation, receipt = this.#pending, incarnation = this.#incarnation;
    const begun = this.P.begin(this.#next(expected, actual));
    if (begun.status === "pending" && begun.snapshot.pending) {
      this.#certificate = { publication: this.P, ticket: begun.ticket, candidate: begun.snapshot.pending, incarnation, snapshot, revision: snapshot.revision, receipt, generation };
    }
    return begun;
  }
  completeInitial(ticket: CriteriaPublicationTicket<S>) {
    this.#safe();
    const certificate = this.#certificate;
    if (!certificate || certificate.ticket !== ticket) throw new Error("Exact initial ticket required");
    try { return this.P.complete(ticket); }
    finally { this.#certificate = null; this.#initialAvailable = false; }
  }
  adopt() {
    const begun = this.prepareInitial();
    if (begun.status !== "pending") return begun;
    return this.completeInitial(begun.ticket);
  }
  revokeInitial(): void { this.#certificate = null; this.#initialAvailable = false; }
  /** Actual ownership change; equal labels still get a new opaque incarnation. */
  changeDomain(context: ResourceContext): void {
    this.revokeInitial();
    this.#incarnation = Object.freeze({});
    this.#context = Object.freeze({ ...context });
    // accepted and receipt origins deliberately remain old until real retirement.
  }
  beginReset(context = this.#context) {
    this.#safe();
    this.changeDomain(context);
    this.#retiring = true;
    return this.P.begin(this.#next());
  }
  completeReset(ticket: CriteriaPublicationTicket<S>) { this.#safe(); return this.P.complete(ticket); }
  #retire(event: CriteriaPublicationEvent<S>): undefined {
    this.#portDepth++;
    try { return this.#performRetirement(event); }
    finally { this.#portDepth--; }
  }
  #performRetirement(event: CriteriaPublicationEvent<S>): undefined {
    this.counts.retire++;
    this.faults.beforeRetire?.();
    const certificate = this.#certificate;
    if (certificate) {
      this.#certificate = null; // one use even when a subsequent check fails
      const candidate = certificate.candidate;
      if (!this.#positive() || certificate.publication !== this.P || event.kind !== "transition" ||
        event.controller !== this.C || event.definition !== this.CD || event.next !== candidate ||
        this.P.getSnapshot().pending !== candidate || certificate.incarnation !== this.#incarnation ||
        certificate.snapshot !== this.C.getSnapshot() || certificate.revision !== this.C.getSnapshot().revision ||
        certificate.generation !== this.#generation || certificate.receipt !== this.#pending ||
        !sameContext(candidate.expected, this.#context) || !sameContext(candidate.actual, this.#context)) throw new Error("Stale initial certificate");
      this.#initialAvailable = false;
      this.counts.emptyAcknowledgement++;
      return undefined;
    }
    if (!this.#retiring) throw new Error("No certified adoption or authorized retirement");
    this.#reject();
    this.#cleanupMode = true;
    try {
      this.counts.clearDispatch++;
      const reset = this.C.dispatch({ type: "selection.cancel" });
      this.#record(reset);
      if (reset.status === "rejected") throw new Error("Reset rejected");
      if (reset.status === "proposed") {
        if (this.faults.proposedOnly) throw new Error("Reset not yet accepted");
        this.counts.clearAccept++;
        const accepted = this.C.accept(reset.proposal); // AFTER dispatch returned
        this.#record(accepted);
        if (accepted.status !== "committed" && accepted.status !== "noop") throw new Error("Reset not accepted");
      }
      if (Object.keys(this.C.getSnapshot().selection).length || this.#pending) throw new Error("Reset incomplete");
    } finally { this.#cleanupMode = false; }
    // This models ONLY owned app transients, NOT real library tool buffers.
    const acknowledged: unknown = this.faults.cleanup?.();
    if (acknowledged !== undefined) throw new Error("Cleanup did not synchronously acknowledge");
    this.appTransient = null;
    this.counts.appCleanup++;
    // A notification failure leaves explicit debt even after the real commit.
    if (this.#notificationDebt) throw new Error("Notification cleanup reconciliation owed");
    this.#acceptedOrigin = this.#incarnation;
    return undefined;
  }
  reconcileNotificationDebt(): void { this.#safe(); this.#notificationDebt = false; }
  authority(): CriteriaAuthority<S> {
    const current = this.P.getSnapshot().current;
    if (!current) throw new Error("Publication not settled");
    return this.P.issue({ controller: this.C, definition: this.CD, context: current.expected, epoch: current.epoch });
  }
  plainAuthority(): CriteriaAuthority<S> {
    const current = this.P.getSnapshot().current;
    if (!current) throw new Error("Publication not settled");
    const issued = this.authority();
    return createCriteriaAuthority({ origin: { controller: this.C, definition: this.CD, context: current.expected, epoch: current.epoch }, readCurrent: () => {
      // Source1-style readers must protect callbacks too; the issued authority
      // supplies that check instead of forging a callback scope.
      issued.require();
      const now = this.P.getSnapshot().current;
      if (!now) throw new Error("Unavailable");
      return now;
    } });
  }
  borrow() {
    const authority = this.authority();
    authority.require();
    let local = "synthetic-view";
    const releaseParticipant = this.P.registerParticipant(authority, { purge() { local = ""; return undefined; }, cleanup() { return undefined; } });
    const unsubscribe = this.C.subscribe(() => {});
    return { authority, get local() { return local; }, release() { releaseParticipant(); unsubscribe(); } };
  }
  finalize() {
    if (this.C.isDisposed() && this.P.getSnapshot().phase === "disposed") return this.P.dispose();
    this.#safe(); this.revokeInitial(); this.#retiring = true;
    const result = this.P.dispose();
    if (result.status === "disposed") this.C.dispose();
    return result;
  }
}
function sameContext(a: ResourceContext, b: ResourceContext): boolean {
  return a.access && b.access && a.definitionKey === b.definitionKey && a.scopeKey === b.scopeKey;
}
/** Supplied C alone never establishes history. Only its real app owner may adopt. */
export function adoptSupplied<S extends QuerySchema, T extends RowData>(C: TableController<S>, history?: ApplicationOwner<S, T>) {
  if (!history || history.C !== C) return { status: "unavailable" } as const;
  if (history.P.getSnapshot().phase === "settled") return { status: "borrowed", view: history.borrow() } as const;
  return history.adopt();
}
/** Explicit app replacement guard; native construction alone does not compare schemas. */
export function prepareReplacement<S extends QuerySchema, T extends RowData, N extends QuerySchema, U extends RowData>(old: ApplicationOwner<S, T>, input: OwnerInputs<N, U>) {
  const previous = old.CD.schema, next = input.native.controllerDefinition.schema;
  if (canonicalJson(previous) !== canonicalJson(next) && previous.id === next.id && previous.version === next.version) throw new Error("Changed schema requires new ID/version");
  return ApplicationOwner.create(input); // invalid new state leaves old owner alive
}
