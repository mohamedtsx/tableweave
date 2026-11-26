import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../../", import.meta.url);
const helper = "packages/heroui/src/filters/criteria-ports.ts";
const files = (await readdir(fileURLToPath(new URL("./", import.meta.url))))
  .filter(
    (name) =>
      !name.startsWith(".") &&
      !["README.md", "handoff-hashes.json"].includes(name),
  )
  .map((name) => `tests/criteria-ports/${name}`);
const hashes = {};
for (const path of [helper, ...files].sort())
  hashes[path] = createHash("sha256")
    .update(await readFile(new URL(path, root)))
    .digest("hex");
await writeFile(
  new URL("./handoff-hashes.json", import.meta.url),
  `${JSON.stringify(hashes, null, 2)}\n`,
  { flag: "wx" },
);
console.log(`${helper} ${hashes[helper]}`);
console.log(
  `Measured ${files.length} new fixture/evidence files; no publication/generation identity or approval.`,
);
