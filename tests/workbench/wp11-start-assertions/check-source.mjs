import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = "tests/workbench/wp11-start-retirement/";
const reader = `${root}final/synthetic-reader.ts`;
const cases = `${root}final/retirement.test.ts`;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function previous(path) {
  const result = spawnSync("git", ["show", `70c95ac:${path}`]);
  assert.equal(result.status, 0);
  return result.stdout.toString();
}
const oldReader = previous(reader);
const oldCases = previous(cases);
const oldId = `const id = \`retirement-synthetic-\${++serial}\`;`;
const newId = `const id = \`00000000-0000-4000-8000-\${String(++serial).padStart(12, "0")}\`;`;
const oldAdoption =
  "    expect(() => session.adoptHydration()).toThrow(SourceEnded);";
const newAdoption = `    const closedBeforeAdoption = session.getSnapshot();
    expect(session.adoptHydration()).toBeUndefined();
    expect(session.getSnapshot()).toBe(closedBeforeAdoption);
    expect(closedBeforeAdoption).toMatchObject({
      phase: "retiring",
      receipt: null,
      sources: null,
    });`;
assert.equal(oldReader.split(oldId).length, 2);
assert.equal(oldCases.split(oldAdoption).length, 2);
assert.equal(await readFile(reader, "utf8"), oldReader.replace(oldId, newId));
assert.equal(
  await readFile(cases, "utf8"),
  oldCases.replace(oldAdoption, newAdoption),
);
const correction = JSON.parse(await readFile(`${root}handoff-hashes.json`));
for (const [file, expected] of Object.entries({
  ...correction.inputs,
  ...correction.artifacts,
}))
  if (file !== reader && file !== cases)
    assert.equal(hash(await readFile(file)), expected.sha256, file);
const original = JSON.parse(
  await readFile("tests/workbench/wp11-start-facade/handoff-hashes.json"),
);
for (const [file, expected] of Object.entries({
  ...original.inputs,
  ...original.artifacts,
}))
  if (file !== "apps/example-start-facade/src/application/bootstrap-session.ts")
    assert.equal(hash(await readFile(file)), expected.sha256, file);
const canonical = JSON.parse(
  await readFile("tests/workbench/wp11-start-facade/before.json"),
).canonical155;
assert.equal(Object.keys(canonical).length, 155);
for (const [file, expected] of Object.entries(canonical))
  assert.equal(hash(await readFile(file)), expected.sha256, file);
const prefix = "00000000-0000-4000-8000-";
assert.equal(prefix.length, 24);
assert.match(`${prefix}000000000001`, /^[a-f0-9-]{36}$/);
assert.match(
  await readFile("apps/example-start-facade/src/application/codec.ts", "utf8"),
  /\^\[a-f0-9-\]\{36\}\$/,
);
console.log(
  "Exact two fixture changes; production parent/codec/other12 correction inputs/28 artifacts/library155 unchanged. UUID-shape constants and no-op assertion inspected, no test/app/framework execution.",
);
