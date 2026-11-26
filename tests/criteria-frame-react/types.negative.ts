import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import type {
  CriteriaFrames,
  CriteriaSourceAuthority,
  CriteriaToolAuthority,
} from "../../packages/react/src/presentation/criteria-frame.js";
import {
  requireCriteriaSource,
  requireCriteriaTool,
} from "../../packages/react/src/presentation/criteria-frame.js";

const schema = defineQuerySchema({
  id: "types-source",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
type Schema = typeof schema;
interface Item {
  id: string;
  amount: number;
}
const other = defineQuerySchema({
  id: "different",
  version: 1,
  fields: { secret: { type: "boolean", owner: "builder" } },
});
export function negatives(
  source: CriteriaSourceAuthority<Schema>,
  tool: CriteriaToolAuthority<Schema>,
  frames: CriteriaFrames<Schema, Item>,
  foreign: CriteriaSourceAuthority<typeof other>,
) {
  // @ts-expect-error CR-N1 distinct source brand is not a tool grant
  const toolCopy: CriteriaToolAuthority<Schema> = source;
  // @ts-expect-error CR-N2 tool brand is not a source grant
  const sourceCopy: CriteriaSourceAuthority<Schema> = tool;
  // @ts-expect-error CR-N3 source-only capability cannot adopt tools
  requireCriteriaTool(source, frames);
  // @ts-expect-error CR-N4 invariant source schema cannot retag another owner
  requireCriteriaSource(foreign, frames);
  // @ts-expect-error CR-N5 structural objects cannot manufacture source brand
  const fabricated: CriteriaSourceAuthority<Schema> = {};
  return [toolCopy, sourceCopy, fabricated];
}
