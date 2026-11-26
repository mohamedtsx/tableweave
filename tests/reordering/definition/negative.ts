import type { DefineTableInput } from "../../../packages/react/src/table/types.js";
import { input, type Item, make, type schema } from "./fixtures.js";
import { typed } from "./types.js";

// @ts-expect-error NEGATIVE actual flags are readonly
typed.reordering.rows = false;
export const wrong: DefineTableInput<typeof schema, Item> = {
  ...input(),
  reordering: {
    // @ts-expect-error NEGATIVE no string boolean coercion
    rows: "true",
  },
};
export const unknown = make({
  ...input(),
  reordering: {
    // @ts-expect-error NEGATIVE unsupported axis is not a capability
    groups: true,
  },
});
// @ts-expect-error NEGATIVE exact optional flags reject explicit undefined
export const explicitUndefined = make({
  ...input(),
  reordering: undefined,
});
