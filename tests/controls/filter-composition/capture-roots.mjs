import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory, generation } from "./generation.mjs";
import { rootDigests } from "./roots.mjs";

const entries = rootDigests();
const text = `${JSON.stringify(entries, null, 2)}\n`;
const aggregate = createHash("sha256").update(text).digest("hex");
const before = join(evidenceDirectory, "roots-before.json");
mkdirSync(evidenceDirectory, { recursive: true });
if (process.argv.includes("--before")) {
  if (existsSync(before))
    throw new Error(
      "Preserve the existing guard; use a fresh main-approved evidence generation",
    );
  writeFileSync(before, text);
} else {
  if (readFileSync(before, "utf8") !== text)
    throw new Error("Source/public output changed during the frozen run");
  writeFileSync(join(evidenceDirectory, "roots-after.json"), text);
}
console.log(
  `${generation}: ${Object.keys(entries).length} source/public files: ${aggregate}`,
);
