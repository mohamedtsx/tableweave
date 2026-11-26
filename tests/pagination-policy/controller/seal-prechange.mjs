import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hash, own, requireOriginal } from "./guard.mjs";

await requireOriginal();
const baselines = JSON.parse(
  await readFile(join(own, ".artifacts/paged-baselines.json"), "utf8"),
);
assert.equal(Object.keys(baselines).length, 24);
const red = JSON.parse(
  await readFile(join(own, ".artifacts/before-disabled/vitest.json"), "utf8"),
);
assert.equal(red.numFailedTests, 18);
assert.equal(red.numPassedTests, 0);
const observations = JSON.parse(
  await readFile(join(own, ".artifacts/before-disabled/denials.json"), "utf8"),
);
assert.equal(observations.length, 18);
assert(observations.every((value) => value.actualPassed === false));
for (const name of ["fixtures.ts", "baseline.test.ts", "policy.test.ts"])
  await writeFile(
    join(own, ".artifacts", `prechange-${name}`),
    await readFile(join(own, name)),
    { flag: "wx" },
  );
const paths = [
  "paged-baselines.json",
  ".artifacts/before-runtime105.json",
  ".artifacts/before-other.json",
  ".artifacts/original-store.ts",
  ".artifacts/original-reducer.ts",
  ".artifacts/before-paged.log",
  ".artifacts/before-disabled.log",
  ".artifacts/before-paged/vitest.json",
  ".artifacts/before-disabled/vitest.json",
  ".artifacts/before-disabled/denials.json",
  ".artifacts/graph-before.json",
  ".artifacts/server-before.mjs",
  ".artifacts/server-before.log",
  ".artifacts/prechange-fixtures.ts",
  ".artifacts/prechange-baseline.test.ts",
  ".artifacts/prechange-policy.test.ts",
];
const seal = Object.fromEntries(
  await Promise.all(
    paths.map(async (path) => [
      path,
      hash(
        await readFile(
          join(
            own,
            path === "paged-baselines.json"
              ? ".artifacts/paged-baselines.json"
              : path,
          ),
        ),
      ),
    ]),
  ),
);
await writeFile(
  join(own, ".artifacts/prechange-seal.json"),
  JSON.stringify(seal, null, 2),
  { flag: "wx" },
);
console.log(
  "Sealed24 literal paged cases +18 actual red failures + original sources/protected map/import graph before edits",
);
