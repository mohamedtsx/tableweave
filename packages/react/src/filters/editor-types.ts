import type {
  ContractIssue,
  OperatorDescriptor,
  QueryFor,
  QuerySchema,
  RuleFor,
  ScalarId,
} from "../contracts/types.js";
import type { CompileOptions } from "./plan.js";

export type BuilderFieldId<S extends QuerySchema> = {
  [K in keyof S["fields"]]: "builder" extends S["fields"][K]["owner"]
    ? K
    : never;
}[keyof S["fields"]] &
  string;

export type BuilderField<S extends QuerySchema> = {
  [K in BuilderFieldId<S>]: {
    readonly id: K;
    readonly field: S["fields"][K];
  };
}[BuilderFieldId<S>];

type OperatorForField<Rule, K extends string> = Rule extends {
  readonly field: infer Field extends string;
  readonly operator: infer Operator extends string;
}
  ? K extends Field
    ? Operator
    : Field extends K
      ? Operator
      : never
  : never;

export type FieldOperator<
  S extends QuerySchema,
  K extends BuilderFieldId<S>,
> = Omit<OperatorDescriptor, "id"> & {
  readonly id: OperatorForField<RuleFor<S>, K>;
};

export interface RuleDraftOptions extends CompileOptions {
  /** Omit to append; replacement must preserve this existing rule's ID. */
  readonly replaceRuleId?: string;
}
export type RuleDraftResult<S extends QuerySchema> =
  | {
      readonly status: "valid";
      readonly rule: RuleFor<S>;
      /** Validation preview only: dispatch/controlled acceptance remains separate. */
      readonly query: QueryFor<S>;
    }
  | {
      readonly status: "incomplete" | "invalid";
      /** Code-only diagnostics: never raw draft values, messages or exceptions. */
      readonly issues: readonly ContractIssue[];
    };

/** Plain own enumerable data fields; accessors/prototype properties are rejected. */
export interface OptionSourceContext {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly fieldId: string;
  readonly access: boolean;
}
export interface FilterOption<Id extends ScalarId = ScalarId> {
  readonly id: Id;
  readonly label: string;
  readonly disabled?: boolean;
}
export interface SelectedOptionLabel<Id extends ScalarId = ScalarId> {
  readonly id: Id;
  readonly label: string;
  /** False means label is exactly String(id), not an invented option. */
  readonly known: boolean;
}
export interface OptionRequest {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly fieldId: string;
  /** Opaque per-source identity; only the exact returned token can settle. */
  readonly sourceId: object;
  readonly generation: number;
  readonly term: string;
  readonly pageKey: string;
}
/** Plain data envelope; retry is a captured callback value, not a getter. */
export interface OptionRequestInput {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly fieldId: string;
  readonly term: string;
  readonly pageKey: string;
  // biome-ignore lint/suspicious/noConfusingVoidType: App transport callbacks can be synchronous or asynchronous.
  readonly retry?: (request: OptionRequest) => void | Promise<unknown>;
}
/** Plain data envelope. Metadata is validated and copied before settlement. */
export interface OptionPageResult<Id extends ScalarId = ScalarId> {
  readonly options: readonly FilterOption<Id>[];
  /** Application-provided: never inferred from page length. */
  readonly hasMore: boolean;
}
export interface OptionPage<Id extends ScalarId = ScalarId>
  extends OptionPageResult<Id> {
  readonly request: OptionRequest;
}
export type OptionSourceErrorCode =
  | "unavailable"
  | "offline"
  | "timeout"
  | "access-lost";
export interface OptionSourceError {
  readonly code: OptionSourceErrorCode;
  readonly message: string;
}
export type OptionInvalidationReason =
  | "scope-change"
  | "definition-change"
  | "field-change"
  | "access-change"
  | "access-loss"
  | "reset"
  | "unmount"
  | "dispose";
export interface OptionInvalidation {
  readonly reason: OptionInvalidationReason;
  readonly previous: OptionSourceContext;
  readonly next: OptionSourceContext;
}
export interface OptionSourceOptions {
  /** Synchronous application lifecycle port. No table/row-resource ownership. */
  readonly onInvalidate?: (event: OptionInvalidation) => void;
}
export interface OptionSourceView<Id extends ScalarId = ScalarId> {
  readonly context: OptionSourceContext;
  readonly active: boolean;
  readonly kind:
    | "idle"
    | "pending"
    | "ready"
    | "failure"
    | "blocked"
    | "disposed";
  readonly request: OptionRequest | null;
  /** One current term/page only. A changed term/page drops the previous page. */
  readonly page: OptionPage<Id> | null;
  /** Only currently supplied accepted IDs; off-page labels survive refresh/error. */
  readonly selected: readonly SelectedOptionLabel<Id>[];
  readonly error: OptionSourceError | null;
  readonly invalidationFailed: boolean;
  readonly display:
    | "idle"
    | "loading"
    | "options"
    | "empty"
    | "error"
    | "blocked";
  readonly notice: "loading" | "load-failed" | null;
  readonly busy: boolean;
  readonly stale: boolean;
  readonly canChoose: boolean;
  readonly canLoadMore: boolean;
  readonly canRetry: boolean;
}
export interface OptionSource<Id extends ScalarId = ScalarId> {
  readonly getSnapshot: () => OptionSourceView<Id>;
  /** Stable initial empty view; no cache hydration/SSR integration is implied. */
  readonly getServerSnapshot: () => OptionSourceView<Id>;
  readonly subscribe: (listener: () => void) => () => void;
  readonly begin: (input: OptionRequestInput) => OptionRequest | null;
  readonly succeed: (
    request: OptionRequest,
    result: OptionPageResult<Id>,
  ) => boolean;
  readonly fail: (request: OptionRequest, publicCode: unknown) => boolean;
  readonly retry: () => OptionRequest | null;
  /** Accepted-ID INPUT, not a selection command; never mutates any applied rule. */
  readonly setSelectedIds: (
    expected: OptionSourceContext,
    ids: readonly Id[],
  ) => boolean;
  /** Current-token recovery only; unselected labels are validated but not retained. */
  readonly recoverSelectedLabels: (
    request: OptionRequest,
    labels: readonly FilterOption<Id>[],
  ) => boolean;
  /** Explicit app context acceptance; same-scope restoration is explicit permission. */
  readonly setContext: (context: OptionSourceContext) => void;
  readonly clear: (reason?: "reset" | "unmount") => void;
  /** Stable source owner uses a PASSIVE effect, not picker-open/layout lifetime. */
  readonly connect: () => () => void;
  readonly dispose: () => void;
}
