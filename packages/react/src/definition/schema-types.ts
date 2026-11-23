import type {
  FieldDefinition,
  FieldIdValue,
  QuerySchema,
} from "../contracts/types.js";

export type FieldValue<F extends FieldDefinition> =
  | (F["type"] extends "number"
      ? number
      : F["type"] extends "boolean"
        ? boolean
        : F["type"] extends "set"
          ? readonly FieldIdValue<F>[]
          : F["type"] extends "enum"
            ? FieldIdValue<F>
            : F["type"] extends "datetime"
              ? string | Date
              : string)
  | null
  | undefined;
export type FieldAccessors<S extends QuerySchema, Row> = {
  readonly [K in keyof S["fields"]]?: (
    record: Row,
  ) => FieldValue<S["fields"][K]>;
};
