import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  statfs,
  writeFile,
} from "node:fs/promises";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
export const root = fileURLToPath(new URL("../../../", import.meta.url)),
  own = "tests/benchmarks/wp14-guards/";
export const changed = [
  "tests/benchmarks/wp14/candidate.mjs",
  "tests/benchmarks/wp14/driver.mjs",
];
export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export async function capacity() {
  const s = await statfs(root);
  assert(s.bavail * s.bsize >= 134217728, "Below128MiB: no cleanup authority");
}
export async function measure(path) {
  const bytes = await readFile(resolve(root, path)),
    value = await stat(resolve(root, path));
  return { sha256: sha(bytes), size: bytes.length, mode: value.mode & 0o777 };
}
export async function files(path = ".", excludeOwn = false) {
  const result = [];
  for (const entry of await readdir(resolve(root, path), {
    withFileTypes: true,
  })) {
    if (
      ["node_modules", ".git", ".repo", ".npmrc"].includes(entry.name) ||
      entry.name.startsWith(".env")
    )
      continue;
    const name = relative(root, resolve(root, path, entry.name));
    if (excludeOwn && `${name}/` === own) continue;
    if (entry.isDirectory()) result.push(...(await files(name, excludeOwn)));
    else if (entry.isFile()) result.push(name);
  }
  return result.sort();
}
export async function scope(capture = false) {
  const canonical = await readFile(
    "/tmp/opencode/wp10-move-reason-integrated-source155.json",
  );
  assert.equal(
    sha(canonical),
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837",
  );
  const library = JSON.parse(canonical);
  assert.equal(Object.keys(library).length, 155);
  for (const [path, expected] of Object.entries(library)) {
    const value = await measure(path);
    assert.equal(value.sha256, expected.sha256);
    assert.equal(value.mode & 0o111 ? "100755" : "100644", expected.mode);
  }
  const sealPath = "tests/benchmarks/wp14/evidence/handoff-hashes.json",
    sealBytes = await readFile(resolve(root, sealPath)),
    original = JSON.parse(sealBytes);
  assert.equal(Object.keys(original.inputs).length, 31);
  assert.equal(Object.keys(original.artifacts).length, 117);
  assert.equal(
    original.inputAggregate,
    "1cd83de1ef83361d8fb0fc81440109289c755874326ba222452c3bd65d360c08",
  );
  assert.equal(
    original.artifactAggregate,
    "68f1e5571a5a11ef905531b5aa3b685d9d25601cbf9f32871abf0d7004e7be58",
  );
  for (const [path, expected] of Object.entries({
    ...original.inputs,
    ...original.artifacts,
  })) {
    if (!capture && changed.includes(path)) continue;
    assert.deepEqual(await measure(path), expected, path);
  }
  const pinPath = "tests/benchmarks/wp14/evidence/light-008/inputs.json",
    pinBytes = await readFile(resolve(root, pinPath)),
    pins = JSON.parse(pinBytes);
  assert.equal(Object.keys(pins.records).length, 1335);
  for (const [path, expected] of Object.entries(pins.records)) {
    if (!capture && changed.includes(path)) continue;
    assert.deepEqual(await measure(path), expected, path);
  }
  const current = Object.fromEntries(
    await Promise.all(
      (await files(".", true)).map(async (path) => [path, await measure(path)]),
    ),
  );
  const target = resolve(root, `${own}evidence/before.json`);
  if (capture) {
    await capacity();
    await mkdir(resolve(root, `${own}evidence/preimages`), { recursive: true });
    for (const path of changed)
      await writeFile(
        resolve(root, `${own}evidence/preimages/${path.split("/").at(-1)}.txt`),
        await readFile(resolve(root, path)),
        { flag: "wx" },
      );
    await writeFile(
      target,
      `${JSON.stringify({ suppliedHead: "f60df08 (main-reported; no worker Git)", canonical155: sha(canonical), originalSeal: { path: sealPath, sha256: sha(sealBytes), inputs: original.inputs, artifacts: original.artifacts }, originalPin: { path: pinPath, sha256: sha(pinBytes) }, files: current }, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      `BEFORE ${Object.keys(current).length} old regular inputs/modes; original31/117/1335 pin and155 verified; two exact preimages captured.`,
    );
  } else {
    const before = JSON.parse(await readFile(target, "utf8")),
      drift = [];
    assert.equal(sha(sealBytes), before.originalSeal.sha256);
    assert.equal(sha(pinBytes), before.originalPin.sha256);
    for (const path of new Set([
      ...Object.keys(before.files),
      ...Object.keys(current),
    ])) {
      if (changed.includes(path)) {
        assert.equal(current[path].mode, before.files[path].mode);
        assert.notEqual(current[path].sha256, before.files[path].sha256);
        assert.equal(
          (
            await measure(
              `${own}evidence/preimages/${path.split("/").at(-1)}.txt`,
            )
          ).sha256,
          before.files[path].sha256,
        );
        continue;
      }
      if (JSON.stringify(current[path]) === JSON.stringify(before.files[path]))
        continue;
      assert(
        ["TASKS.md", "REVIEW.md", "README.md"].includes(path) ||
          path.startsWith("docs/"),
        `FROZEN ${path}`,
      );
      drift.push(path);
    }
    console.log(
      JSON.stringify({
        protectedOld: Object.keys(before.files).length,
        canonicalLibraries: 155,
        changedBodies: changed,
        mainBookkeepingDrift: drift,
        history:
          "Original31/117/1335 bytes retained; not a current original-all-hashes pass",
      }),
    );
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert(["capture", "verify"].includes(process.argv[2]));
  await scope(process.argv[2] === "capture");
}
