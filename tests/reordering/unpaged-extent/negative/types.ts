import type { ReorderStamp } from "../../../../packages/react/src/reordering/index.js";
import type { ReorderApplicationMetadata } from "../../../../packages/react/src/reordering-controller/index.js";

declare const original: ReorderStamp;
const undefinedExtent: ReorderStamp = { ...original, extent: undefined };
const nullExtent: ReorderStamp = { ...original, extent: null };
const unknownExtent: ReorderStamp = { ...original, extent: "dataset" };
const appExtent: ReorderApplicationMetadata = {
  ownerEpoch: 1,
  sourceVersion: 2,
  revision: 3,
  baseRevision: "3",
  extent: "complete",
};
export { undefinedExtent, nullExtent, unknownExtent, appExtent };
