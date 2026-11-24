import { join } from "node:path";
import {
  assertGenerationEnvironment,
  getPublicGeneration,
} from "../../foundation/public-generations.mjs";
import { own } from "./roots.mjs";

// Explicit generations preserve failed evidence. Unknown labels never bless
// whatever happens to be installed or emitted at the time of the check.
export const generation = process.env.FILTER_CONTROLS_GENERATION ?? "original";
const approved = getPublicGeneration(generation);
assertGenerationEnvironment(generation, process.env);
const run = process.env.FILTER_CONTROLS_RUN;
if (run !== undefined && !/^[a-zA-Z0-9-]{1,80}$/.test(run))
  throw new Error("Invalid filter-controls evidence run label");
export const evidenceDirectory = join(
  own,
  ".artifacts",
  ...(generation === "original" && run === undefined ? [] : [generation]),
  ...(run === undefined ? [] : [run]),
);
export const expectedPublicAggregate = approved.outputSha256;
export const expectedPublicCount = approved.outputCount;
