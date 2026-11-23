export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };
export type FieldType =
  | "text"
  | "number"
  | "enum"
  | "set"
  | "boolean"
  | "date"
  | "datetime";
export type FilterOwner = "builder" | "search" | "tabs" | "date" | "none";
export type Join = "and" | "or";
export type ScalarId = string | number;
export type Cardinality = "none" | "one" | "many" | "range";
export type RelativePreset =
  | "today"
  | "yesterday"
  | "tomorrow"
  | "thisWeek"
  | "lastWeek"
  | "nextWeek"
  | "thisMonth"
  | "lastMonth"
  | "nextMonth"
  | "thisYear"
  | "lastYear"
  | "nextYear";
export type DatePoint =
  | { readonly kind: "day"; readonly value: string }
  | { readonly kind: "instant"; readonly value: string };
export type DateValue =
  | DatePoint
  | { readonly kind: "relative"; readonly preset: RelativePreset }
  | {
      readonly kind: "rolling";
      readonly days: number;
      readonly direction: "past" | "future";
    };
export type DateRange = readonly [DatePoint, DatePoint];
export type StandaloneDate =
  | { readonly operator: "date.on"; readonly value: DateValue }
  | { readonly operator: "date.between"; readonly value: DateRange };

interface FieldBase {
  readonly owner: FilterOwner;
  readonly operators?: readonly string[];
  readonly sort?: boolean;
  readonly nullable?: boolean;
}
export type FieldDefinition = FieldBase &
  (
    | {
        readonly type: "text";
        readonly preset?: "text" | "email" | "url" | "phone";
        readonly caseSensitive?: boolean;
        readonly trim?: boolean;
      }
    | {
        readonly type: "number";
        readonly preset?: "number" | "currency" | "percentage";
      }
    | {
        readonly type: "enum" | "set";
        readonly preset?:
          | "enum"
          | "tags"
          | "person"
          | "people"
          | "relation"
          | "relations";
        readonly values?: readonly ScalarId[];
        readonly idType?: "string" | "number";
      }
    | { readonly type: "boolean"; readonly preset?: "boolean" }
    | {
        readonly type: "date" | "datetime";
        readonly preset?: "date" | "dateTime";
        readonly relativePresets?: readonly RelativePreset[];
        readonly rollingDays?: readonly number[];
        readonly min?: DatePoint;
        readonly max?: DatePoint;
      }
  );
export type FieldMap = Readonly<Record<string, FieldDefinition>>;
export type TextOperator =
  | "text.contains"
  | "text.notContains"
  | "text.is"
  | "text.isNot"
  | "text.startsWith"
  | "text.notStartsWith"
  | "text.endsWith"
  | "text.notEndsWith";
export type NumberOperator =
  | "number.eq"
  | "number.ne"
  | "number.gt"
  | "number.gte"
  | "number.lt"
  | "number.lte"
  | "number.between"
  | "number.notBetween";
export type EnumOperator =
  | "enum.is"
  | "enum.isNot"
  | "enum.anyOf"
  | "enum.noneOf";
export type SetOperator =
  | "set.anyOf"
  | "set.noneOf"
  | "set.allOf"
  | "set.notAllOf";
export type DateOperator =
  | "date.on"
  | "date.notOn"
  | "date.before"
  | "date.onOrBefore"
  | "date.after"
  | "date.onOrAfter"
  | "date.between"
  | "date.notBetween";
export type BuiltinOperator =
  | "empty"
  | "notEmpty"
  | TextOperator
  | NumberOperator
  | EnumOperator
  | SetOperator
  | "boolean.isTrue"
  | "boolean.isFalse"
  | DateOperator;

export interface OperatorContext {
  readonly field: FieldDefinition;
  readonly locale: string;
  readonly timeZone: string;
  readonly now: number;
}
export interface CustomOperator<
  Id extends string = string,
  Value extends JsonValue = JsonValue,
  Types extends readonly FieldType[] = readonly FieldType[],
> {
  readonly id: Id;
  readonly labelKey: string;
  readonly types: Types;
  readonly cardinality: Cardinality;
  readonly inverse?: string;
  validate(value: unknown): value is Value;
  normalize?(value: Value): Value;
  evaluate?(
    recordValue: unknown,
    value: Value,
    context: OperatorContext,
  ): boolean;
}
export type AnyCustomOperator = CustomOperator;
export interface OperatorDescriptor {
  readonly id: string;
  readonly labelKey: string;
  readonly types: readonly FieldType[];
  readonly cardinality: Cardinality;
  readonly inverse?: string;
  readonly builtin: boolean;
  readonly custom?: AnyCustomOperator;
}
export interface OperatorRegistry<
  C extends readonly AnyCustomOperator[] = readonly AnyCustomOperator[],
> {
  readonly custom: C;
  readonly descriptors: readonly OperatorDescriptor[];
  get(id: string): OperatorDescriptor | undefined;
}
export interface Limits {
  readonly maxRules: number;
  readonly maxMembershipValues: number;
  readonly maxSearchCharacters: number;
  readonly maxPageRows: number;
}
export interface PredicateRule {
  readonly field: string;
  readonly operator: string;
  readonly value?: JsonValue;
}
export interface WireRule extends PredicateRule {
  readonly id: string;
}
export interface TabDefinition {
  readonly id: string;
  readonly join?: Join;
  readonly rules: readonly PredicateRule[];
}
export interface SearchPolicy {
  readonly matcher?: string;
  readonly caseSensitive?: boolean;
  readonly trim?: boolean;
  readonly debounceMs?: number;
}
export interface QuerySchemaDefinition<F extends FieldMap = FieldMap> {
  readonly id: string;
  readonly version: number;
  readonly fields: F;
  readonly tabs?: readonly TabDefinition[];
  readonly defaultTabId?: string | null;
  readonly builder?: { readonly join?: Join };
  readonly search?: SearchPolicy;
  readonly date?: { readonly mode?: "single" | "range" };
  readonly sorting?: { readonly multi?: boolean };
  readonly pagination?: {
    readonly defaultSize?: number;
    readonly sizes?: readonly number[];
  };
  readonly limits?: Partial<Limits>;
}
declare const schemaTypes: unique symbol;
export type QuerySchema<
  D extends QuerySchemaDefinition = QuerySchemaDefinition,
  C extends readonly AnyCustomOperator[] = readonly AnyCustomOperator[],
> = Omit<D, "limits" | "pagination"> & {
  readonly limits: Limits;
  readonly pagination: {
    readonly defaultSize: number;
    readonly sizes: readonly number[];
  };
  readonly [schemaTypes]?: { readonly operators: C };
};
export type SchemaOperators<S extends QuerySchema> = NonNullable<
  S[typeof schemaTypes]
>["operators"];
export type FieldsOf<S extends QuerySchema> = S["fields"];
type OwnerKeys<F extends FieldMap, O extends FilterOwner> = {
  [K in keyof F]: O extends F[K]["owner"] ? K : never;
}[keyof F] &
  string;
export type FieldIds<S extends QuerySchema> = keyof FieldsOf<S> & string;
type CustomId<
  C extends readonly AnyCustomOperator[],
  T extends FieldType,
> = C[number] extends infer O
  ? O extends AnyCustomOperator
    ? T extends O["types"][number]
      ? O["id"]
      : never
    : never
  : never;
type FamilyOps<T extends FieldType> = T extends "text"
  ? TextOperator
  : T extends "number"
    ? NumberOperator
    : T extends "enum"
      ? EnumOperator
      : T extends "set"
        ? SetOperator
        : T extends "boolean"
          ? "boolean.isTrue" | "boolean.isFalse"
          : DateOperator;
type EmptyOps<F extends FieldDefinition> = F["type"] extends "boolean"
  ? F extends { readonly nullable: true }
    ? "empty" | "notEmpty"
    : never
  : "empty" | "notEmpty";
export type AllowedOperators<
  F extends FieldDefinition,
  C extends readonly AnyCustomOperator[],
> = FamilyOps<F["type"]> | EmptyOps<F> | CustomId<C, F["type"]>;
export type CheckedFields<
  F extends FieldMap,
  C extends readonly AnyCustomOperator[],
> = {
  readonly [K in keyof F]: F[K] & {
    readonly operators?: string extends NonNullable<F[K]["operators"]>[number]
      ? readonly string[]
      : readonly AllowedOperators<F[K], C>[];
  };
};
type ExposedOps<
  F extends FieldDefinition,
  C extends readonly AnyCustomOperator[],
> = F extends { readonly operators: readonly (infer O)[] }
  ? Extract<O, AllowedOperators<F, C>>
  : FamilyOps<F["type"]> | EmptyOps<F>;
export type FieldIdValue<F extends FieldDefinition> = F extends {
  readonly values: readonly (infer V extends ScalarId)[];
}
  ? V
  : F extends { readonly idType: "number" }
    ? number
    : string;
type CustomValue<
  C extends readonly AnyCustomOperator[],
  Id,
> = C[number] extends infer O
  ? O extends CustomOperator<infer I, infer V>
    ? Id extends I
      ? O extends { readonly cardinality: "none" }
        ? never
        : V
      : never
    : never
  : never;
type DatePointFor<F extends FieldDefinition> = F["type"] extends "date"
  ? Extract<DatePoint, { kind: "day" }>
  : DatePoint;
type RelativeFor<F extends FieldDefinition> = F extends {
  readonly relativePresets: readonly (infer P)[];
}
  ? Extract<P, RelativePreset>
  : RelativePreset;
type RollingFor<F extends FieldDefinition> = F extends {
  readonly rollingDays: readonly (infer N extends number)[];
}
  ? {
      readonly kind: "rolling";
      readonly days: N;
      readonly direction: "past" | "future";
    }
  : never;
export type DateValueFor<F extends FieldDefinition> =
  | DatePointFor<F>
  | { readonly kind: "relative"; readonly preset: RelativeFor<F> }
  | RollingFor<F>;
export type DateRangeFor<F extends FieldDefinition> =
  | readonly [
      Extract<DatePoint, { kind: "day" }>,
      Extract<DatePoint, { kind: "day" }>,
    ]
  | (F["type"] extends "datetime"
      ? readonly [
          Extract<DatePoint, { kind: "instant" }>,
          Extract<DatePoint, { kind: "instant" }>,
        ]
      : never);
type Operand<
  F extends FieldDefinition,
  O extends string,
  C extends readonly AnyCustomOperator[],
> = O extends "empty" | "notEmpty" | "boolean.isTrue" | "boolean.isFalse"
  ? never
  : O extends TextOperator
    ? string
    : O extends "number.between" | "number.notBetween"
      ? readonly [number, number]
      : O extends NumberOperator
        ? number
        : O extends "enum.is" | "enum.isNot"
          ? FieldIdValue<F>
          : O extends EnumOperator | SetOperator
            ? readonly [FieldIdValue<F>, ...FieldIdValue<F>[]]
            : O extends "date.between" | "date.notBetween"
              ? DateRangeFor<F>
              : O extends DateOperator
                ? DateValueFor<F>
                : CustomValue<C, O>;
type OperatorRule<
  F extends FieldDefinition,
  C extends readonly AnyCustomOperator[],
> = {
  [O in ExposedOps<F, C>]: [Operand<F, O, C>] extends [never]
    ? { readonly operator: O; readonly value?: never }
    : { readonly operator: O; readonly value: Operand<F, O, C> };
}[ExposedOps<F, C>];
export type RuleFor<S extends QuerySchema> = Extract<
  {
    [K in OwnerKeys<FieldsOf<S>, "builder">]: {
      readonly id: string;
      readonly field: K;
    } & OperatorRule<FieldsOf<S>[K], SchemaOperators<S>>;
  }[OwnerKeys<FieldsOf<S>, "builder">],
  WireRule
>;
type SortKeys<F extends FieldMap> = {
  [K in keyof F]: "sort" extends keyof F[K]
    ? true extends NonNullable<F[K]["sort"]>
      ? K
      : never
    : never;
}[keyof F] &
  string;
type TabIds<S extends QuerySchema> = "tabs" extends keyof S
  ? NonNullable<S["tabs"]>[number]["id"]
  : never;
export interface WireQuery {
  readonly version: 1;
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly builder: {
    readonly join: Join;
    readonly rules: readonly WireRule[];
  };
  readonly search: string;
  readonly tabId: string | null;
  readonly date: StandaloneDate | null;
  readonly sorting: readonly { readonly id: string; readonly desc: boolean }[];
  readonly pagination: {
    readonly pageIndex: number;
    readonly pageSize: number;
  };
  readonly locale: string;
  readonly timeZone: string;
}
export type QueryFor<S extends QuerySchema> = Omit<
  WireQuery,
  "schemaId" | "schemaVersion" | "builder" | "tabId" | "date" | "sorting"
> & {
  readonly schemaId: S["id"];
  readonly schemaVersion: S["version"];
  readonly builder: {
    readonly join: Join;
    readonly rules: readonly RuleFor<S>[];
  };
  readonly tabId: TabIds<S> | null;
  readonly date:
    | null
    | {
        [K in OwnerKeys<FieldsOf<S>, "date">]: StandaloneDateFor<
          S,
          FieldsOf<S>[K]
        >;
      }[OwnerKeys<FieldsOf<S>, "date">];
  readonly sorting: readonly {
    readonly id: SortKeys<FieldsOf<S>>;
    readonly desc: boolean;
  }[];
};
type StandaloneDateFor<
  S extends QuerySchema,
  F extends FieldDefinition,
> = S extends { readonly date: { readonly mode: "single" } }
  ? { readonly operator: "date.on"; readonly value: DateValueFor<F> }
  :
      | {
          readonly operator: "date.on";
          readonly value: Exclude<DateValueFor<F>, DatePoint>;
        }
      | { readonly operator: "date.between"; readonly value: DateRangeFor<F> };
export type QueryInput<S extends QuerySchema> = Pick<
  WireQuery,
  "locale" | "timeZone"
> &
  Partial<
    Omit<
      QueryFor<S>,
      "version" | "schemaId" | "schemaVersion" | "locale" | "timeZone"
    >
  >;
export type IssueCode =
  | "schema.invalid"
  | "schema.version"
  | "schema.owner"
  | "schema.operator"
  | "query.invalid"
  | "query.context"
  | "query.limit"
  | "query.tab"
  | "query.sort"
  | "query.date"
  | "rule.field"
  | "rule.operator"
  | "rule.value"
  | "rule.id"
  | "operator.invalid"
  | "operator.client"
  | "operator.translation"
  | "operator.replacement";
export interface ContractIssue {
  readonly code: IssueCode;
  readonly field?: string;
  readonly ruleId?: string;
}
export type ContractResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly issues: readonly ContractIssue[] };
