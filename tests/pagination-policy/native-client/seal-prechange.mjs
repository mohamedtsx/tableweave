import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hash, own, requireOriginal, root } from "./guard.mjs";

await requireOriginal();
const raw = await readFile(join(own, ".artifacts/paged-baselines.raw.json"));
assert.equal(Object.keys(JSON.parse(raw)).length, 36);
const red = JSON.parse(
  await readFile(join(own, ".artifacts/before-disabled/vitest.json"), "utf8"),
);
assert.equal(red.numFailedTests, 5);
assert.equal(red.numPassedTests, 0);
const formatter = spawnSync(
  process.execPath,
  [
    join(root, "node_modules/@biomejs/biome/bin/biome"),
    "check",
    "--write",
    `--stdin-file-path=${join(own, "paged-baselines.json")}`,
  ],
  { input: raw, encoding: "utf8", cwd: root },
);
assert.equal(formatter.status, 0, formatter.stderr);
assert.deepEqual(JSON.parse(formatter.stdout), JSON.parse(raw));
await writeFile(join(own, "paged-baselines.json"), formatter.stdout, {
  flag: "wx",
});
for (const p of ["fixtures.ts", "baseline.test.ts", "disabled.test.ts"])
  await writeFile(
    join(own, ".artifacts", `prechange-${p}`),
    await readFile(join(own, p)),
    { flag: "wx" },
  );
const files = [
  ".artifacts/paged-baselines.raw.json",
  "paged-baselines.json",
  ".artifacts/before-source105.json",
  ".artifacts/before-other.json",
  ".artifacts/original-types.ts",
  ".artifacts/original-definition.ts",
  ".artifacts/original-adapter.ts",
  ".artifacts/before-paged.log",
  ".artifacts/before-disabled.log",
  ".artifacts/before-paged/vitest.json",
  ".artifacts/before-disabled/vitest.json",
  ".artifacts/before-disabled/observations.json",
  ".artifacts/graph-before.json",
  ".artifacts/native-before.mjs",
  ".artifacts/bare-before.log",
  ".artifacts/prechange-fixtures.ts",
  ".artifacts/prechange-baseline.test.ts",
  ".artifacts/prechange-disabled.test.ts",
];
await writeFile(
  join(own, ".artifacts/prechange-seal.json"),
  JSON.stringify(
    Object.fromEntries(
      await Promise.all(
        files.map(async (p) => [p, hash(await readFile(join(own, p)))]),
      ),
    ),
    null,
    2,
  ),
  { flag: "wx" },
);
console.log(
  "Sealed36 prechange paged cases,5 actual red tests, original3/source105 and native graph before producer edits",
);
