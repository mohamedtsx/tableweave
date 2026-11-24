import { defineQuerySchema } from "@tableweave/react/contracts";
import {
  type CriteriaFacadeSource,
  CriteriaFacadeToolbar,
  publishCriteriaFacadeSource,
} from "../../packages/heroui/src/filters/criteria-facade-config.js";
import type { TableRendererTarget } from "../../packages/heroui/src/table/types.js";
import type { Item, S } from "./fixtures.js";

declare const search: CriteriaFacadeSource<"search", S, Item>;
declare const otherRows: TableRendererTarget<S, { different: number }>;
// @ts-expect-error S3-N1 real source anchors the record, target cannot widen it
publishCriteriaFacadeSource(search, otherRows);
declare const builder: CriteriaFacadeSource<"builder", S, Item>;
// @ts-expect-error S3-N2 actual Builder UI is not adopted by this toolbar bridge
const unsupported = <CriteriaFacadeToolbar source={builder} />;
void unsupported;
const otherSchema = defineQuerySchema({
  id: "other-source",
  version: 1,
  fields: { other: { type: "boolean", owner: "builder" } },
});
// @ts-expect-error S3-N3 exact schema is invariant at a source boundary
const wrongSchema: CriteriaFacadeSource<"search", typeof otherSchema, Item> =
  search;
void wrongSchema;
// @ts-expect-error S3-N4 kind is part of the fixed source identity
const tabs: CriteriaFacadeSource<"tabs", S, Item> = search;
void tabs;
