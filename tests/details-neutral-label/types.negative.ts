import type { QuerySchema } from "@tableweave/react/contracts";
import type { RecordDetailsProps } from "../../packages/heroui/src/data-table/details-provider.js";
import type { DetailsAccessory } from "../../packages/heroui/src/details/types.js";
export function negatives<S extends QuerySchema, T extends object>(
  accessory: DetailsAccessory<S, T>,
  foreign: DetailsAccessory<S, { readonly other: boolean }>,
) {
  const props: RecordDetailsProps<S, T> = { accessory };
  // @ts-expect-error NL-N1 neutral metadata readonly
  props.neutralLabel = "General details";
  // @ts-expect-error NL-N2 present undefined is not omission with exact optional types
  const invalid: RecordDetailsProps<S, T> = {
    accessory,
    neutralLabel: undefined,
  };
  const number: RecordDetailsProps<S, T> = {
    accessory,
    // @ts-expect-error NL-N3 no implicit value coercion
    neutralLabel: 1,
  };
  const wrongRecord: RecordDetailsProps<S, T> = {
    // @ts-expect-error NL-N4 optional label does not widen the accessory's record type
    accessory: foreign,
    neutralLabel: "General details",
  };
  return { invalid, number, wrongRecord };
}
