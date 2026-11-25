import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { root, own, files, measure, capacity, scope, sha } from "./scope.mjs";
export async function seal(capture = false) {
  await scope();
  const target = `${own}evidence/handoff-hashes.json`,
    delta = `${own}evidence/source.delta.patch`;
  const all = (await files(own)).filter(
    (path) => path !== target && path !== delta,
  );
  const source = all.filter(
    (path) => !/\/evidence\/(?:light|format)-/.test(path),
  );
  if (capture) {
    await capacity();
    let patch = "";
    for (const path of source) {
      const result = spawnSync(
        "diff",
        [
          "-u",
          "--label",
          "/dev/null",
          "--label",
          `after/${path}`,
          "/dev/null",
          resolve(root, path),
        ],
        { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
      );
      assert.equal(result.status, 1, path);
      patch += result.stdout;
    }
    await writeFile(resolve(root, delta), patch, { flag: "wx" });
  }
  const inputs = Object.fromEntries(
    await Promise.all(
      [...source, delta]
        .sort()
        .map(async (path) => [path, await measure(path)]),
    ),
  );
  const artifacts = Object.fromEntries(
    await Promise.all(
      all
        .filter((path) => !source.includes(path))
        .sort()
        .map(async (path) => [path, await measure(path)]),
    ),
  );
  const before = JSON.parse(
    await readFile(resolve(root, `${own}evidence/before.json`), "utf8"),
  );
  const value = {
    status:
      "PROVISIONAL SOURCE ONLY; all generator/oracle/statistics/config/runtime/paint/benchmark execution UNRUN; runner/candidate HOLD",
    suppliedHead: before.suppliedHead,
    protectedOldInputs: Object.keys(before.files).length,
    canonical155: before.canonical155,
    inputAggregate: sha(JSON.stringify(inputs)),
    artifactAggregate: sha(JSON.stringify(artifacts)),
    inputs,
    artifacts,
  };
  if (capture)
    await writeFile(
      resolve(root, target),
      `${JSON.stringify(value, null, 2)}\n`,
      { flag: "wx" },
    );
  else
    assert.deepEqual(
      value,
      JSON.parse(await readFile(resolve(root, target), "utf8")),
    );
  console.log(
    `${Object.keys(inputs).length} source/metadata inputs ${value.inputAggregate}; ${Object.keys(artifacts).length} raw artifacts ${value.artifactAggregate};155 libraries/${value.protectedOldInputs} protected old regular files/modes, main bookkeeping drift separately disclosed.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert(["capture", "verify"].includes(process.argv[2]));
  await seal(process.argv[2] === "capture");
}
