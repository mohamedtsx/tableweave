import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("../../../", import.meta.url);
const baselinePath = process.argv[2];
assert(baselinePath, "Supply the preserved canonical145 source map.");
const bytes = await readFile(baselinePath);
const hash = (input) => createHash("sha256").update(input).digest("hex");
assert.equal(
  hash(bytes),
  "31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe",
);
const baseline = JSON.parse(bytes);
const owned = [
  "packages/react/src/table/types.ts",
  "packages/react/src/table/definition.ts",
];
let protectedSources = 0;
for (const [path, entry] of Object.entries(baseline)) {
  if (owned.includes(path)) continue;
  assert.equal(hash(await readFile(new URL(path, root))), entry.sha256, path);
  protectedSources++;
}
assert.equal(protectedSources, 143);
const inputs = {};
for (const path of owned) {
  const source = await readFile(new URL(path, root), "utf8");
  const parsed = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  assert.equal(parsed.parseDiagnostics.length, 0, path);
  inputs[path] = hash(source);
}
const output = new URL("./.artifacts/", import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(
  new URL("scope.json", output),
  `${JSON.stringify({ sourceOnly: true, protectedSources, inputs, runtimeOrNegativeExecuted: false }, null, 2)}\n`,
);
console.log(
  `Two owned sources parse; ${protectedSources} protected source hashes match. No producer was imported from ${fileURLToPath(root)}.`,
);
