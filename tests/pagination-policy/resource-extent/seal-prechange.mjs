import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hash, own, requireOriginal, root } from "./guard.mjs";

await requireOriginal();
const raw = await readFile(join(own, ".artifacts/legacy-baselines.raw.json"));
assert.equal(JSON.parse(raw).length, 5);
const red = JSON.parse(
  await readFile(join(own, ".artifacts/before-extent/vitest.json"), "utf8"),
);
assert.equal(red.numFailedTests, 5);
assert.equal(red.numPassedTests, 0);
const formatted = spawnSync(
  process.execPath,
  [
    join(root, "node_modules/@biomejs/biome/bin/biome"),
    "check",
    "--write",
    `--stdin-file-path=${join(own, "legacy-baselines.json")}`,
  ],
  { input: raw, encoding: "utf8", cwd: root },
);
assert.equal(formatted.status, 0, formatted.stderr);
assert.deepEqual(JSON.parse(raw), JSON.parse(formatted.stdout));
await writeFile(join(own, "legacy-baselines.json"), formatted.stdout, {
  flag: "wx",
});
for (const p of ["fixtures.ts", "baseline.test.ts", "before-policy.test.ts"])
  await writeFile(
    join(own, ".artifacts", `prechange-${p}`),
    await readFile(join(own, p)),
    { flag: "wx" },
  );
const files = [
  ".artifacts/legacy-baselines.raw.json",
  "legacy-baselines.json",
  ".artifacts/before-source105.json",
  ".artifacts/before-other.json",
  ".artifacts/original-types.ts",
  ".artifacts/original-adapter.ts",
  ".artifacts/original-view.ts",
  ".artifacts/before-legacy.log",
  ".artifacts/before-extent.log",
  ".artifacts/before-legacy/vitest.json",
  ".artifacts/before-extent/vitest.json",
  ".artifacts/before-extent/before-policy-observations.json",
  ".artifacts/graph-before.json",
  ".artifacts/resource-before.mjs",
  ".artifacts/bare-before.log",
  ".artifacts/prechange-fixtures.ts",
  ".artifacts/prechange-baseline.test.ts",
  ".artifacts/prechange-before-policy.test.ts",
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
  "Sealed5 legacy scenarios +5 actual red cases, source105/original3/graph before edits",
);
