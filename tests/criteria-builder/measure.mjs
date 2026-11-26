import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url), own = new URL("./", import.meta.url);
const sources = ["types.ts", "filter-builder.tsx", "option-owners.tsx", "value-editors.tsx", "criteria-builder-host.tsx"].map(name => `packages/heroui/src/filters/${name}`);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
async function walk(base, prefix = "tests/criteria-builder/") {
  const paths = [];
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if ([".artifacts", "README.md", "handoff-hashes.json"].includes(entry.name)) continue;
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) paths.push(...await walk(new URL(`${entry.name}/`, base), `${path}/`));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}
const files = Object.fromEntries(await Promise.all([...sources, ...await walk(own)].sort().map(async path => [path, { sha256: hash(await readFile(new URL(path, root))), mode: (await stat(new URL(path, root))).mode & 0o777 }])));
const aggregate = hash(JSON.stringify(Object.fromEntries(Object.entries(files).map(([path, data]) => [path, data.sha256]))));
const seal = { sourceMap: "2361efaa0666c9c126437f9f7d1b490eb609d75a4b0c85a18dd3a8bbfe2156ed", historicalMap: "8281387f44e3ef1e0392159d329e05c7a5e0d319311f42b673beaa923ceee1e2", aggregate, files };
const target = new URL("./handoff-hashes.json", import.meta.url);
if (process.argv[2] === "seal") await writeFile(target, `${JSON.stringify(seal, null, 2)}\n`, { flag: "wx" });
else assert.deepEqual(seal, JSON.parse(await readFile(target, "utf8")));
console.log(`${Object.keys(files).length} inputs (${sources.length} sources) measured; aggregate ${aggregate}. README/seal/.artifacts excluded; no historical seal changed.`);
