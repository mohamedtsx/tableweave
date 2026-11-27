import {
  beginControlsRequest,
  type ControlsInput,
  type ControlsRequestBinding,
  createNativeController,
  createResourceAdapter,
  defineNativeTable,
  getControlsRequestBinding,
  type NativeDefinition,
  type ResourceAdapter,
  type ResourceContext,
  type ResourceRequest,
  type StateProposal,
  type TableCommand,
  type TableController,
} from "@tableweave/react";
import {
  createQuery,
  defineQuerySchema,
  type QueryFor,
} from "@tableweave/react/contracts";

export const schema = defineQuerySchema({
  id: "combined-controls",
  version: 1,
  sorting: { multi: true },
  pagination: { defaultSize: 3, sizes: [3, 6] },
  fields: {
    name: { type: "text", owner: "builder", sort: true },
    score: { type: "number", owner: "builder", sort: true },
    team: { type: "text", owner: "builder", sort: true },
  },
});

export interface ExampleRecord {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  readonly team: string;
  readonly eligible: boolean;
}

export const records: readonly ExampleRecord[] = Object.freeze(
  [
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Echo",
    "Foxtrot",
    "Golf",
    "Hotel",
    "India",
    "Juliet",
    "Kilo",
    "Lima",
  ].map((name, index) =>
    Object.freeze({
      id: String.fromCharCode(97 + index),
      name,
      score: index + 1,
      team: index % 2 ? "West" : "East",
      eligible: index !== 1,
    }),
  ),
);

export interface ExampleOptions {
  readonly id: string;
  readonly mode: "client" | "server";
  readonly single: boolean;
  readonly controlled: boolean;
  readonly locale: string;
  readonly initialPage: number;
  readonly correction: boolean;
}

interface ActionReceipt {
  readonly ids: readonly string[];
  readonly loaded: readonly string[];
  readonly missing: readonly string[];
}

interface AppState {
  readonly context: ResourceContext;
  readonly epoch: number;
  /** Causal origin of the accepted render, not a copy of controller query state. */
  readonly acceptedEpoch: number;
  readonly proposal: StateProposal<typeof schema> | null;
  readonly transportCount: number;
  readonly total: number;
  readonly queue: readonly string[];
  readonly feedback: string;
  readonly note: string;
  readonly failAction: boolean;
}

/** Synthetic application owner, not a library facade or backend service. */
export class ExampleOwner {
  readonly definition: NativeDefinition<typeof schema, ExampleRecord>;
  readonly controller: TableController<typeof schema>;
  readonly resource: ResourceAdapter<ExampleRecord, QueryFor<typeof schema>>;
  readonly audit = {
    commits: [] as string[],
    requests: [] as string[],
    actions: [] as ActionReceipt[],
    normalMounts: 0,
    normalUnmounts: 0,
  };
  private state: AppState;
  private readonly listeners = new Set<() => void>();
  private committed: ControlsInput<typeof schema, ExampleRecord> | null = null;
  private requestBinding: ControlsRequestBinding<typeof schema> | null = null;
  private snapshotBinding: ControlsRequestBinding<typeof schema> | null = null;
  private live = false;
  private lifetime = 0;
  private serial = 0;
  private externalIntent = false;

  constructor(readonly options: ExampleOptions) {
    this.state = Object.freeze({
      context: Object.freeze({
        definitionKey: `example:${options.id}`,
        scopeKey: "A",
        access: true,
      }),
      epoch: 0,
      acceptedEpoch: 0,
      proposal: null,
      transportCount: 0,
      total: records.length,
      queue: [],
      feedback: "",
      note: "",
      failAction: false,
    });
    this.definition = defineNativeTable<typeof schema, ExampleRecord>({
      schema,
      selection: options.single ? "single" : "multiple",
      multiSort: true,
      getRowId: (record) => record.id,
      isRowSelectable: (record) => record.eligible,
      columns: [
        { id: "selection", header: "Selection", meta: { utility: true } },
        {
          id: "identity",
          header: "Identity",
          columns: [
            {
              id: "name",
              header: "Name",
              accessorKey: "name",
              meta: { rowHeader: true },
            },
            { id: "team", header: "Team", accessorKey: "team" },
          ],
        },
        {
          id: "metrics",
          header: "Metrics",
          columns: [
            {
              id: "score",
              header: "Score",
              accessorKey: "score",
              sortDescFirst: false,
            },
          ],
        },
      ],
    });
    this.controller = createNativeController(this.definition, {
      initial: {
        query: createQuery(schema, {
          locale: options.locale,
          timeZone: "UTC",
          builder: {
            join: "and",
            rules: [
              {
                id: "positive-score",
                field: "score",
                operator: "number.gt",
                value: 0,
              },
            ],
          },
          pagination: { pageIndex: options.initialPage, pageSize: 3 },
        }),
      },
      // Query proposals provide an app-owned PRE-ACCEPTANCE intent boundary.
      // No controller proxy/authority wrapper or speculative query copy is used.
      controlled: options.controlled
        ? ["query", "selection", "columns"]
        : ["query"],
      now: () => 0,
      onRequest: (proposal) => {
        const reason = proposal.transition.reason;
        this.audit.requests.push(reason);
        if (
          proposal.transition.queryChanged &&
          reason !== "pagination.clamp" &&
          !this.externalIntent
        )
          this.advanceEpoch();
        this.update({ proposal });
        if (!options.controlled) {
          const origin = this.state.context;
          const epoch = this.state.epoch;
          const lifetime = this.lifetime;
          queueMicrotask(() => {
            if (
              this.live &&
              this.lifetime === lifetime &&
              this.state.proposal === proposal &&
              this.state.context === origin &&
              this.state.epoch === epoch
            )
              this.accept();
          });
        }
      },
      onCommit: (transition) => {
        this.audit.commits.push(transition.reason);
        if (transition.queryChanged && transition.reason !== "pagination.clamp")
          this.update({ acceptedEpoch: this.state.epoch });
      },
      onQueryChange: () => {
        if (this.live && options.mode === "server") this.begin();
      },
    });
    this.resource = createResourceAdapter(this.state.context, {
      onInvalidate: () => {
        this.resetOwnedState();
        this.requestBinding = null;
        this.snapshotBinding = null;
      },
    });
  }

  readonly getSnapshot = () => this.state;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private update(patch: Partial<AppState>) {
    this.state = Object.freeze({ ...this.state, ...patch });
    for (const listener of this.listeners) listener();
  }
  advanceEpoch() {
    this.update({ epoch: this.state.epoch + 1 });
  }

  /** Exactly one application acquisition; the UI controls do not acquire it. */
  connect() {
    this.lifetime++;
    const disconnect = this.resource.connect();
    this.live = true;
    if (this.options.mode === "server") {
      this.begin();
      this.settle();
    }
    return () => {
      this.live = false;
      this.lifetime++;
      disconnect();
    };
  }
  commit(input: ControlsInput<typeof schema, ExampleRecord>) {
    this.committed = input;
  }
  readonly readCommitted = () => {
    if (!this.committed) throw new Error("Example has not committed");
    return this.committed;
  };
  bindings() {
    return { request: this.requestBinding, snapshot: this.snapshotBinding };
  }

  private send(request: ResourceRequest<QueryFor<typeof schema>>) {
    this.requestBinding = getControlsRequestBinding(
      this.definition,
      this.controller,
      this.resource,
      request,
    );
    this.update({ transportCount: this.state.transportCount + 1 });
    // This is the actual application transport seam. The scenario buttons settle
    // this genuine token explicitly; no network/backend integration is claimed.
  }
  begin() {
    const start = beginControlsRequest(
      this.definition,
      this.controller,
      this.resource,
      {
        ...this.state.context,
        queryKey: this.controller.getSnapshot().queryIdentity,
        requestKey: `${this.options.id}:${++this.serial}`,
        retry: (request) => this.send(request),
      },
    );
    if (start) {
      this.requestBinding = start.binding;
      this.send(start.request);
    }
    return start?.request ?? null;
  }
  settle(total = this.state.total, unknown = false) {
    const token = this.resource.getSnapshot().request;
    if (!token) return false;
    const offset =
      token.query.pagination.pageIndex * token.query.pagination.pageSize;
    // Synthetic application-side server response, not another UI/native pipeline.
    const ordered = records.slice(0, total).sort((a, b) => {
      for (const sort of token.query.sorting) {
        const left = a[sort.id];
        const right = b[sort.id];
        if (left !== right)
          return (left < right ? -1 : 1) * (sort.desc ? -1 : 1);
      }
      return 0;
    });
    const accepted = this.resource.succeed(token, {
      source: "fresh",
      records: ordered.slice(offset, offset + token.query.pagination.pageSize),
      page: unknown
        ? {
            kind: "unknown",
            hasNextPage: offset + token.query.pagination.pageSize < total,
          }
        : { kind: "known", total },
      emptyKind: total === 0 ? "dataset" : "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    });
    if (accepted) this.snapshotBinding = this.requestBinding;
    this.update({ total });
    return accepted;
  }
  fail() {
    const token = this.resource.getSnapshot().request;
    if (token) this.resource.fail(token, "offline");
  }
  accept() {
    const proposal = this.state.proposal;
    if (!proposal) return;
    try {
      this.controller.accept(proposal);
    } catch {
      this.update({ feedback: "The requested change is no longer current." });
    } finally {
      if (this.state.proposal === proposal) this.update({ proposal: null });
    }
  }
  reject() {
    if (this.state.proposal) this.controller.reject(this.state.proposal);
    this.update({ proposal: null });
  }
  /** App/external accepted intent, including synthetic same-turn race probes. */
  external(command: TableCommand<typeof schema>, queryIntent = false) {
    if (queryIntent) this.advanceEpoch();
    this.externalIntent = true;
    try {
      const result = this.controller.dispatch(command);
      if (result.status === "proposed") this.controller.accept(result.proposal);
      if (queryIntent && result.status === "noop")
        this.update({ acceptedEpoch: this.state.epoch });
      if (this.state.proposal) this.update({ proposal: null });
    } finally {
      this.externalIntent = false;
    }
  }
  /** Mandatory application lifecycle reset, NOT a user-controlled Cancel. */
  private resetOwnedState() {
    // Retire intent even if selection.cancel will be a noop. A noop dispatch
    // does not retire the controller's pending query/selection/column proposal.
    this.reject();
    this.external({ type: "selection.cancel" });
    this.update({ queue: [], feedback: "", note: "" });
  }
  setExpected(context: ResourceContext, immediate = false) {
    if (
      context.definitionKey !== this.state.context.definitionKey ||
      context.scopeKey !== this.state.context.scopeKey ||
      context.access !== this.state.context.access
    )
      // Retire old intent before exposing the new expected owner, including the
      // render-before-resource-effect window. Invalidation also covers resets,
      // resource-originated access loss and actual lifetime/disposal boundaries.
      this.resetOwnedState();
    this.advanceEpoch();
    this.update({
      context: Object.freeze({ ...context }),
      acceptedEpoch: this.state.epoch,
    });
    if (immediate) this.resource.setContext(this.state.context);
  }
  syncContext(context: ResourceContext) {
    this.resource.setContext(context);
  }
  setNote(note: string) {
    this.update({ note });
  }
  setFailAction() {
    this.update({ failAction: !this.state.failAction });
  }
  reportFailure() {
    this.update({ feedback: "The review queue could not be updated." });
  }
  enqueue(receipt: ActionReceipt) {
    if (this.state.failAction)
      throw new Error("Synthetic private action detail");
    this.audit.actions.push(receipt);
    const queue = [...new Set([...this.state.queue, ...receipt.ids])];
    this.update({
      queue,
      feedback: `Queued ${receipt.ids.length} IDs: ${receipt.loaded.length} loaded, ${receipt.missing.length} unavailable.`,
    });
  }
}
