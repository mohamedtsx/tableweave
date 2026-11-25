import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { capacity, hash, measure, own, root, walk } from "./scope.mjs";

await capacity();
const target = `${own}evidence/handoff-hashes.json`;
const inputs = {},
  artifacts = {};
for (const path of await walk(own, false)) {
  if (path === target) continue;
  const group = path.includes("/.artifacts/") ? artifacts : inputs;
  group[path] = await measure(path);
}
const before = JSON.parse(
  await readFile(`${root}/${own}evidence/before.json`, "utf8"),
);
const record = {
  status:
    "implementation-ready-PROVISIONAL; runtime/manual/independent UNRUN; review27n1 obligation retained; drag/G02 blocked",
  suppliedBase: before.suppliedBase,
  canonical155: before.canonical155,
  oldInputCount: Object.keys(before.inputs).length,
  runtimePolicy:
    "Future evidence/.runtime generations are separate and excluded; do not rebaseline this source/LIGHT producer",
  newInputAggregate: hash(JSON.stringify(inputs)),
  artifactAggregate: hash(JSON.stringify(artifacts)),
  inputs,
  artifacts,
};
if (process.argv[2] === "capture")
  await writeFile(`${root}/${target}`, `${JSON.stringify(record, null, 2)}\n`, {
    flag: "wx",
  });
else
  assert.deepEqual(
    record,
    JSON.parse(await readFile(`${root}/${target}`, "utf8")),
  );
console.log(
  `${Object.keys(inputs).length} new inputs ${record.newInputAggregate}; ${Object.keys(artifacts).length} artifacts ${record.artifactAggregate}. Immutable original155/old-source maps not replaced.`,
);
