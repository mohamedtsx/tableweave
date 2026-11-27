import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertCapturedGeneration,
  assertFreshPublic,
  generation,
  generationDirectory,
} from "./roots.mjs";

const directory = generationDirectory();
mkdirSync(directory, { recursive: true });
const before = join(directory, "roots-before.json");
let roots;
if (process.argv.includes("--before")) {
  if (existsSync(before))
    throw new Error(
      "Never overwrite a named generation's before proof; main must allocate a new name",
    );
  roots = assertFreshPublic();
  writeFileSync(
    before,
    `${JSON.stringify({ generation: generation(), roots }, null, 2)}\n`,
  );
} else {
  roots = assertCapturedGeneration();
  writeFileSync(
    join(directory, "roots-after.json"),
    `${JSON.stringify({ generation: generation(), roots }, null, 2)}\n`,
  );
}
console.log(
  `${generation()}: ${Object.keys(roots.sources).length} source / ${Object.keys(roots.outputs).length} outputs unchanged; ${roots.publicSha256}`,
);
