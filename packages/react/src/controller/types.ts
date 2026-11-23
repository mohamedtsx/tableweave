import type {
  Join,
  JsonValue,
  OperatorRegistry,
  QueryFor,
  QuerySchema,
  RuleFor,
} from "../contracts/types.js";

export type Updater<T> = T | ((previous: T) => T);
export type SelectionState = Readonly<Record<string, boolean>>;
export interface ColumnState {
  readonly order: readonly string[];
  readonly visibility: Readonly<Record<string, boolean>>;
}
export interface DetailsState {
  readonly rowId: string | null;
}
export type StateGroup = "query" | "selection" | "columns" | "details";
export interface ColumnPolicy {
  readonly id: string;
  readonly hideable?: boolean;
  readonly utility?: boolean;
  readonly reorderGroup?: string;
}
export interface ControllerDefinitionInput<S extends QuerySchema> {
  readonly schema: S;
  readonly columns?: readonly ColumnPolicy[];
  readonly selection?: boolean;
  readonly details?: boolean;
}
export interface ControllerDefinition<S extends QuerySchema = QuerySchema> {
  readonly schema: S;
  readonly columns: readonly ColumnPolicy[];
  readonly selection: boolean;
  readonly details: boolean;
}
export interface StateSeed<S extends QuerySchema> {
  readonly query: QueryFor<S>;
  readonly selection?: SelectionState;
  readonly columns?: Partial<ColumnState>;
  readonly details?: DetailsState;
}
export interface TableState<S extends QuerySchema = QuerySchema> {
  readonly definitionIdentity: string;
  readonly revision: number;
  readonly query: QueryFor<S>;
  readonly selection: SelectionState;
  readonly columns: ColumnState;
  readonly details: DetailsState;
  readonly filterIdentity: string;
  readonly queryIdentity: string;
  readonly evaluatedAt: number;
}
export interface TransitionContext {
  readonly now: number;
  readonly registry?: OperatorRegistry;
}
export type TableCommand<S extends QuerySchema> =
  | { readonly type: "builder.commit"; readonly rule: RuleFor<S> }
  | {
      readonly type: "builder.duplicate";
      readonly ruleId: string;
      readonly newRuleId: string;
    }
  | {
      readonly type: "builder.negate";
      readonly ruleId: string;
      readonly replacement?: JsonValue;
    }
  | { readonly type: "builder.remove"; readonly ruleId: string }
  | { readonly type: "builder.join"; readonly join: Join }
  | { readonly type: "builder.clear" }
  | { readonly type: "search.commit"; readonly search: string }
  | { readonly type: "tabs.change"; readonly tabId: QueryFor<S>["tabId"] }
  | { readonly type: "date.commit"; readonly date: QueryFor<S>["date"] }
  | { readonly type: "query.replace"; readonly update: Updater<QueryFor<S>> }
  | {
      readonly type: "query.context";
      readonly locale: string;
      readonly timeZone: string;
    }
  | {
      readonly type: "sorting.change";
      readonly update: Updater<QueryFor<S>["sorting"]>;
    }
  | {
      readonly type: "pagination.change";
      readonly update: Updater<QueryFor<S>["pagination"]>;
    }
  | {
      readonly type: "pagination.clamp";
      readonly pageCount: number;
      readonly queryIdentity: string;
    }
  | { readonly type: "clock.tick" }
  | {
      readonly type: "selection.change";
      readonly update: Updater<SelectionState>;
    }
  | {
      readonly type: "selection.page";
      readonly pageIds: readonly string[];
      readonly eligibleIds: readonly string[];
      readonly selected: boolean;
      readonly queryIdentity: string;
    }
  | { readonly type: "selection.cancel" }
  | {
      readonly type: "columns.visibility";
      readonly update: Updater<ColumnState["visibility"]>;
    }
  | {
      readonly type: "columns.order";
      readonly update: Updater<ColumnState["order"]>;
    }
  | { readonly type: "details.change"; readonly update: Updater<DetailsState> };
export interface StateTransition<S extends QuerySchema> {
  readonly state: TableState<S>;
  readonly reason: TableCommand<S>["type"];
  readonly changedGroups: readonly StateGroup[];
  readonly queryChanged: boolean;
  readonly filterChanged: boolean;
}
export interface StateProposal<S extends QuerySchema> {
  readonly id: number;
  readonly baseRevision: number;
  readonly transition: StateTransition<S>;
}
export type MutationResult<S extends QuerySchema> =
  | { readonly status: "noop" }
  | { readonly status: "proposed"; readonly proposal: StateProposal<S> }
  | {
      readonly status: "committed";
      readonly transition: StateTransition<S>;
      readonly notificationFailures: number;
    }
  | { readonly status: "rejected"; readonly code: "callback" };
export interface ControllerOptions<S extends QuerySchema> {
  readonly initial: StateSeed<S>;
  readonly controlled?: readonly StateGroup[];
  readonly registry?: OperatorRegistry;
  readonly now: () => number;
  /** Pure synchronous constraint; throw to reject before proposal or commit. */
  readonly validateState?: (state: TableState<S>) => void;
  readonly onRequest?: (proposal: StateProposal<S>) => void;
  readonly onCommit?: (transition: StateTransition<S>) => void;
  readonly onQueryChange?: (
    query: QueryFor<S>,
    transition: StateTransition<S>,
  ) => void;
}
export interface TableController<S extends QuerySchema> {
  getDefinition(): ControllerDefinition<S>;
  getSnapshot(): TableState<S>;
  getServerSnapshot(): TableState<S>;
  subscribe(listener: () => void): () => void;
  dispatch(command: TableCommand<S>): MutationResult<S>;
  accept(
    proposal: StateProposal<S>,
    override?: { readonly selection: SelectionState },
  ): MutationResult<S>;
  reject(proposal: StateProposal<S>): void;
  dispose(): void;
  isDisposed(): boolean;
}
