import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url), own = new URL("./", import.meta.url);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const before = JSON.parse(await readFile(new URL("./before.json", import.meta.url), "utf8"));
const report = new URL("./ast-results.json", import.meta.url);
if (process.argv[2] === "seal") await writeFile(report, await readFile(new URL("./.artifacts/production-ast.json", import.meta.url)), { flag: "wx" });
const ast = JSON.parse(await readFile(report, "utf8"));
for (const [path, captured] of Object.entries(before.preimages)) {
  assert.equal(ast[path].before, captured.sha256, path);
  assert.equal(ast[path].after, hash(await readFile(new URL(path, root))), path);
}
async function walk(directory, prefix = "tests/criteria-builder-format/") {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".artifacts", "README.md", "handoff-hashes.json"].includes(entry.name)) continue;
    if (entry.isDirectory()) paths.push(...await walk(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`));
    else if (entry.isFile()) paths.push(`${prefix}${entry.name}`);
  }
  return paths;
}
const paths = [...Object.keys(before.preimages), ...await walk(own)].sort();
const files = Object.fromEntries(await Promise.all(paths.map(async path => [path, { sha256: hash(await readFile(new URL(path, root))), mode: (await stat(new URL(path, root))).mode & 0o777 }])));
const aggregate = hash(JSON.stringify(Object.fromEntries(Object.entries(files).map(([path, data]) => [path, data.sha256]))));
const seal = { sourceMapSha256: before.sourceMapSha256, historicalBuilderAggregate: "7422a760f9c995a2bf3a574cbb0d90d9a3133fdd62d8eb30b26541e95730a52b", aggregate, files };
const target = new URL("./handoff-hashes.json", import.meta.url);
if (process.argv[2] === "seal") await writeFile(target, `${JSON.stringify(seal, null, 2)}\n`, { flag: "wx" });
else assert.deepEqual(seal, JSON.parse(await readFile(target, "utf8")));
console.log(`${paths.length} format-stage inputs; aggregate ${aggregate}; old Builder seal remains unchanged historical input.`);
