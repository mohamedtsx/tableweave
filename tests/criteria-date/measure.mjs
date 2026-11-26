import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url),
  own = new URL("./", import.meta.url);
const before = JSON.parse(
  await readFile(new URL("./before.json", import.meta.url), "utf8"),
);
const sources = [
  "toolbar/filter-date.tsx",
  "toolbar/criteria-tool-host.tsx",
  "date/date-types.ts",
  "date/date-operand-editor.tsx",
  "date/date-picker.tsx",
  "date/date-instant.tsx",
  "date/date-segments.tsx",
  "date/criteria-date-state.tsx",
].map((path) => `packages/heroui/src/${path}`);
const fixtures = (await readdir(own))
  .filter(
    (name) =>
      name !== "README.md" &&
      name !== "handoff-hashes.json" &&
      !name.startsWith("."),
  )
  .sort()
  .map((name) => `tests/criteria-date/${name}`);
const files = Object.fromEntries(
  await Promise.all(
    [...sources, ...fixtures].map(async (path) => [
      path,
      createHash("sha256")
        .update(await readFile(new URL(path, root)))
        .digest("hex"),
    ]),
  ),
);
const value = {
  sources: Object.fromEntries(
    sources.map((path) => [
      path,
      { before: before[path]?.sha256 ?? null, after: files[path] },
    ]),
  ),
  files,
};
const manifest = new URL("./handoff-hashes.json", import.meta.url);
if (process.argv[2] === "record")
  await writeFile(manifest, `${JSON.stringify(value, null, 2)}\n`);
else
  assert.deepEqual(
    value,
    JSON.parse(await readFile(manifest, "utf8")),
    "Current source/own fixture hashes match the handoff seal",
  );
console.log(
  JSON.stringify({
    mode: process.argv[2] === "record" ? "record" : "check",
    sourceDeltas: value.sources,
    ownFixtureEvidenceFiles: fixtures.length,
    totalMeasured: Object.keys(files).length,
    excludes: ["README.md", "handoff-hashes.json", ".artifacts"],
  }),
);
