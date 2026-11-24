import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const directory = fileURLToPath(new URL("./", import.meta.url));
const source = [
  "options-source",
  "options-criteria",
  "options-criteria-core",
].map((name) => `packages/react/src/filters/${name}.ts`);
const fixtures = (await readdir(directory))
  .filter(
    (name) =>
      name !== "README.md" &&
      name !== "handoff-hashes.json" &&
      !name.startsWith("."),
  )
  .map((name) => `tests/options-criteria/${name}`);
const hashes = {};
for (const path of [...source, ...fixtures].sort()) {
  hashes[path] = createHash("sha256")
    .update(await readFile(new URL(path, `file://${root}`)))
    .digest("hex");
}
await writeFile(
  new URL("./handoff-hashes.json", import.meta.url),
  `${JSON.stringify(hashes, null, 2)}\n`,
  { flag: "wx" },
);
for (const path of source) console.log(`${path} ${hashes[path]}`);
console.log(
  `Measured ${fixtures.length} own fixture/evidence files. Not an output-generation identity or source approval.`,
);
