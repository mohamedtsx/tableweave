import type { QuerySchema } from "@tableweave/react/contracts";
import {
  arabicDetailsRegionLabel,
  englishDetailsRegionLabel,
  RecordDetails,
  type RecordDetailsProps,
} from "../../packages/heroui/src/data-table/details-provider.js";
import type { DetailsAccessory } from "../../packages/heroui/src/details/types.js";
export function positive<S extends QuerySchema, T extends object>(
  accessory: DetailsAccessory<S, T>,
) {
  const props: RecordDetailsProps<S, T> = {
    accessory,
    neutralLabel: arabicDetailsRegionLabel,
  };
  return (
    <>
      <RecordDetails {...props} />
      <RecordDetails accessory={accessory} />
      <RecordDetails
        accessory={accessory}
        neutralLabel={englishDetailsRegionLabel}
      />
      <RecordDetails
        accessory={accessory}
        neutralLabel="General details region"
      />
    </>
  );
}
