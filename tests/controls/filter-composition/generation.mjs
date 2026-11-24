import { join } from "node:path";
import { own } from "./roots.mjs";

// Explicit generations preserve failed evidence. Unknown labels never bless
// whatever happens to be installed or emitted at the time of the check.
const generations = Object.freeze({
  original: "ad59470c7d472563ed273b8b167073953f6f574df0a1910510480082da63a8ce",
  fc01: "de82ce232f3021a754b1e30df780eac27cd358604766cde4110cc922bf25f095",
});
export const generation = process.env.FILTER_CONTROLS_GENERATION ?? "original";
if (!Object.hasOwn(generations, generation))
  throw new Error("Unknown main-approved filter-controls output generation");
const run = process.env.FILTER_CONTROLS_RUN;
if (run !== undefined && !/^[a-zA-Z0-9-]{1,80}$/.test(run))
  throw new Error("Invalid filter-controls evidence run label");
export const evidenceDirectory = join(
  own,
  ".artifacts",
  ...(generation === "original" && run === undefined ? [] : [generation]),
  ...(run === undefined ? [] : [run]),
);
export const expectedPublicAggregate = generations[generation];
