import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  root,
  own,
  changed,
  files,
  measure,
  capacity,
  scope,
  sha,
} from "./scope.mjs";
export async function seal(capture = false) {
  await scope();
  const target = `${own}evidence/handoff-hashes.json`,
    delta = `${own}evidence/source.delta.patch`;
  const all = (await files(own)).filter(
    (path) => path !== target && path !== delta,
  );
  const source = [
    ...changed,
    ...all.filter((path) => !/\/evidence\/(light|format)-/.test(path)),
  ].sort();
  if (capture) {
    await capacity();
    let text = "";
    for (const path of source) {
      const old = changed.includes(path)
        ? resolve(
            root,
            `${own}evidence/preimages/${path.split("/").at(-1)}.txt`,
          )
        : "/dev/null";
      const result = spawnSync(
        "diff",
        [
          "-u",
          "--label",
          changed.includes(path) ? `before/${path}` : "/dev/null",
          "--label",
          `after/${path}`,
          old,
          resolve(root, path),
        ],
        { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
      );
      assert.equal(result.status, 1, path);
      text += result.stdout;
    }
    await writeFile(resolve(root, delta), text, { flag: "wx" });
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
      "PROVISIONAL two-body source correction only; helper MJS semantics/profile/cleanup/unit/runtime/benchmark tests UNRUN",
    suppliedHead: before.suppliedHead,
    changedOldBodies: changed,
    protectedOldInputs: Object.keys(before.files).length,
    canonical155: before.canonical155,
    originalSealSHA256: before.originalSeal.sha256,
    originalPinSHA256: before.originalPin.sha256,
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
    `${Object.keys(inputs).length} correction source/metadata inputs ${value.inputAggregate}; ${Object.keys(artifacts).length} own raw artifacts ${value.artifactAggregate}. Original31/117/1335 remains unchanged HISTORY except2 disclosed body deltas.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert(["capture", "verify"].includes(process.argv[2]));
  await seal(process.argv[2] === "capture");
}
