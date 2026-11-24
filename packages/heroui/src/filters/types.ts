import type {
  MutationResult,
  ResourceContext,
  TableCommand,
  TableController,
} from "@tableweave/react";
import type {
  FieldDefinition,
  JsonValue,
  QuerySchema,
  RuleFor,
  ScalarId,
} from "@tableweave/react/contracts";
import type {
  BuilderFieldId,
  FilterOption,
  OperatorDescriptor,
  OperatorRegistry,
  OptionRequest,
  OptionSource,
  RuleDraftResult,
} from "@tableweave/react/filters";
import type { ReactNode } from "react";
import type { DateEditorMessages } from "../date/date-operand-editor.js";

export interface FilterBuilderMessages {
  filters: string;
  addRule: string;
  field: string;
  operator: string;
  value: string;
  options: string;
  all: string;
  any: string;
  join: string;
  clear: string;
  clearLabel: string;
  duplicate: string;
  negate: string;
  remove: string;
  cancel: string;
  apply: string;
  editorTitle: string;
  chooseField: string;
  chooseOperator: string;
  chooseValue: string;
  searchFields: string;
  searchOptions: string;
  loading: string;
  emptyOptions: string;
  optionsFailed: string;
  retry: string;
  nextOptions: string;
  noFields: string;
  incomplete: string;
  invalid: string;
  mutationFailed: string;
  staleDraft: string;
  submitted: string;
  applied: string;
  removed: string;
  cleared: string;
  accessUnavailable: string;
  unavailableValue: string;
  customEditorMissing: string;
  from: string;
  to: string;
}

/** The app starts transport only after the UI has obtained this source's token. */
interface FilterOptionRequestPort {
  // biome-ignore lint/suspicious/noConfusingVoidType: An app transport can be synchronous or asynchronous.
  readonly onRequest: (request: OptionRequest) => void | Promise<unknown>;
  readonly nextPageKey?: (request: OptionRequest) => string | null;
}
export type FilterOptionPort = FilterOptionRequestPort &
  (
    | { readonly idType: "number"; readonly source: OptionSource<number> }
    | { readonly idType: "string"; readonly source: OptionSource<string> }
    | { readonly idType?: "scalar"; readonly source: OptionSource<ScalarId> }
  );

export interface FilterCustomEditorProps<S extends QuerySchema> {
  readonly fieldId: BuilderFieldId<S>;
  readonly field: FieldDefinition;
  readonly operator: OperatorDescriptor;
  /** Raw local input is deliberately unknown; only validation produces RuleFor<S>. */
  readonly value: unknown;
  readonly acceptedRule: RuleFor<S> | undefined;
  readonly validation: RuleDraftResult<S>;
  readonly locale: string;
  readonly timeZone: string;
  readonly evaluatedAt: number;
  readonly isDisabled: boolean;
  readonly onChange: (value: JsonValue | undefined) => void;
}

export interface FilterFieldPresentation<S extends QuerySchema> {
  readonly label: string;
  readonly operatorLabels?: Readonly<Record<string, string>>;
  readonly choices?: readonly FilterOption<ScalarId>[];
  readonly asyncOptions?: FilterOptionPort;
  readonly formatValue?: (rule: RuleFor<S>) => ReactNode;
  readonly renderEditor?: (props: FilterCustomEditorProps<S>) => ReactNode;
}

export interface FilterBuilderProps<S extends QuerySchema> {
  readonly controller: TableController<S>;
  /** Matches the application's processing owner; compile validation alone does not prove a client evaluator exists. */
  readonly evaluationMode: "client" | "server";
  readonly expectedResourceContext: ResourceContext;
  readonly invalidationKey: string | number;
  readonly fields: Readonly<
    Partial<Record<BuilderFieldId<S>, FilterFieldPresentation<S>>>
  >;
  /** Must be the same registry supplied at controller construction. */
  readonly registry?: OperatorRegistry;
  readonly messages?: Partial<FilterBuilderMessages>;
  readonly createRuleId?: () => string;
  readonly dateMessages?: Partial<DateEditorMessages>;
  readonly onMutation?: (
    result: MutationResult<S>,
    command: TableCommand<S>,
  ) => void;
  readonly className?: string;
}
