import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evidenceDirectory,
  expectedPublicAggregate,
  expectedPublicCount,
  generation,
} from "./generation.mjs";
import { rootDigests } from "./roots.mjs";

const current = Object.fromEntries(
  Object.entries(rootDigests()).filter(([path]) =>
    /^packages\/(?:react|heroui)\/dist\//.test(path),
  ),
);
const text = `${JSON.stringify(current, null, 2)}\n`;
const aggregate = createHash("sha256").update(text).digest("hex");
// The reviewed generation is a committed count/digest, not an ignored snapshot
// left by a previous local run. Per-run source snapshots remain parent-anchored.
if (
  Object.keys(current).length !== expectedPublicCount ||
  aggregate !== expectedPublicAggregate
)
  throw new Error(
    `Main's frozen ${expectedPublicCount}-output handoff no longer matches (${generation})`,
  );
mkdirSync(evidenceDirectory, { recursive: true });
writeFileSync(join(evidenceDirectory, "public-roots-verified.json"), text);
console.log(
  `${generation}: ${expectedPublicCount} frozen public outputs unchanged: ${aggregate}`,
);
