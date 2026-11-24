import type { OperatorRegistry, QuerySchema } from "../contracts/types.js";
import type {
  BuilderField,
  BuilderFieldId,
  FieldOperator,
} from "./editor-types.js";
import { defaultOperatorRegistry, operatorAllowed } from "./registry.js";

export function getBuilderFields<S extends QuerySchema>(
  schema: S,
): readonly BuilderField<S>[] {
  return Object.freeze(
    Object.entries(schema.fields)
      .filter(([, field]) => field.owner === "builder")
      .map(([id, field]) => Object.freeze({ id, field })),
  ) as readonly BuilderField<S>[];
}

export function getFieldOperators<
  S extends QuerySchema,
  K extends BuilderFieldId<S>,
>(
  schema: S,
  fieldId: K,
  registry: OperatorRegistry = defaultOperatorRegistry,
): readonly FieldOperator<S, K>[] {
  const field = Object.hasOwn(schema.fields, fieldId)
    ? schema.fields[fieldId]
    : undefined;
  if (field?.owner !== "builder") return Object.freeze([]);
  return Object.freeze(
    registry.descriptors.filter((operator) => operatorAllowed(field, operator)),
  ) as readonly FieldOperator<S, K>[];
}
