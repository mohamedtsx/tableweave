import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evidenceDirectory,
  expectedPublicAggregate,
  generation,
} from "./generation.mjs";
import { rootDigests, workspace } from "./roots.mjs";

const frozen = readFileSync(
  join(workspace, "tests/controls/integration/.artifacts/roots-before.json"),
  "utf8",
);
const expected = JSON.parse(frozen);
const current = Object.fromEntries(
  Object.entries(rootDigests()).filter(([path]) =>
    /^packages\/(?:react|heroui)\/dist\//.test(path),
  ),
);
const text = `${JSON.stringify(current, null, 2)}\n`;
const aggregate = createHash("sha256").update(text).digest("hex");
if (
  text !== frozen ||
  Object.keys(expected).length !== 180 ||
  aggregate !== expectedPublicAggregate
)
  throw new Error("Main's frozen 180-output handoff no longer matches");
mkdirSync(evidenceDirectory, { recursive: true });
writeFileSync(join(evidenceDirectory, "public-roots-verified.json"), text);
console.log(`${generation}: 180 frozen public outputs unchanged: ${aggregate}`);
