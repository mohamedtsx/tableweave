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
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/workbench/wp11-start-retirement/";
const parent = "apps/example-start-facade/src/application/bootstrap-session.ts";
const originalPath = "tests/workbench/wp11-start-facade/handoff-hashes.json";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalBytes = await readFile(
  "/tmp/opencode/wp10-move-reason-integrated-source155.json",
);
assert.equal(
  hash(canonicalBytes),
  "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837",
);
const canonical = JSON.parse(canonicalBytes);
assert.equal(Object.keys(canonical).length, 155);
async function measure(path) {
  return {
    sha256: hash(await readFile(resolve(root, path))),
    mode: (await stat(resolve(root, path))).mode & 0o777,
  };
}
for (const [path, expected] of Object.entries(canonical)) {
  const value = await measure(path);
  assert.equal(value.sha256, expected.sha256, path);
  assert.equal(value.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
const originalBytes = await readFile(resolve(root, originalPath)),
  original = JSON.parse(originalBytes);
assert.equal(Object.keys(original.inputs).length, 39);
assert.equal(Object.keys(original.artifacts).length, 69);
assert.equal(
  original.newInputAggregate,
  "06b55f21e8e7a21e6d752a8bba0fbe315120d7377a07ff24e803cb97d36d0f6f",
);
assert.equal(
  original.artifactAggregate,
  "3718197b7a1168127f9358d8817bc57d35aaa3b8bd7b3ccedaa74c1f23e379a7",
);
assert.equal(hash(JSON.stringify(original.inputs)), original.newInputAggregate);
assert.equal(
  hash(JSON.stringify(original.artifacts)),
  original.artifactAggregate,
);
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      ["node_modules", ".git", ".repo"].includes(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name === ".npmrc"
    )
      continue;
    const path = resolve(directory, entry.name),
      rel = relative(root, path);
    if (`${rel}/` === own) continue;
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else if (entry.isFile()) result.push(rel);
  }
  return result;
}
const current = Object.fromEntries(
  await Promise.all(
    (await walk(root)).sort().map(async (path) => [path, await measure(path)]),
  ),
);
const target = new URL("./before.json", import.meta.url);
const capture = process.argv[2] === "before";
for (const [path, expected] of Object.entries({
  ...original.inputs,
  ...original.artifacts,
})) {
  if (!capture && path === parent) continue;
  assert.deepEqual(
    await measure(path),
    expected,
    `Original sealed input ${path}`,
  );
}
if (capture) {
  const s = await statfs(root);
  assert(s.bavail * s.bsize >= 134217728);
  await mkdir(new URL("./preimages/", import.meta.url));
  await writeFile(
    new URL("./preimages/bootstrap-session.ts.txt", import.meta.url),
    await readFile(resolve(root, parent)),
    { flag: "wx" },
  );
  await writeFile(
    target,
    `${JSON.stringify({ suppliedHead: "3929614 (no worker Git)", parent, canonical155: hash(canonicalBytes), originalSeal: { path: originalPath, sha256: hash(originalBytes), inputs: original.inputs, artifacts: original.artifacts, newInputAggregate: original.newInputAggregate, artifactAggregate: original.artifactAggregate }, protectedInputs: current }, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `Before correction:155 libraries; original39/69 seal bodies/modes verified; ${Object.keys(current).length} actual old regular inputs/modes; exact parent preimage captured. Credential-shaped files excluded; main owns their byte confirmation.`,
  );
} else {
  const before = JSON.parse(await readFile(target, "utf8"));
  assert.equal(hash(originalBytes), before.originalSeal.sha256);
  assert.equal(
    hash(
      await readFile(
        new URL("./preimages/bootstrap-session.ts.txt", import.meta.url),
      ),
    ),
    before.protectedInputs[parent].sha256,
  );
  const frozen = (record) =>
    Object.fromEntries(
      Object.entries(record).filter(([path]) => path !== parent),
    );
  assert.deepEqual(frozen(current), frozen(before.protectedInputs));
  assert.equal(current[parent].mode, before.protectedInputs[parent].mode);
  assert.notEqual(
    current[parent].sha256,
    before.protectedInputs[parent].sha256,
  );
  console.log(
    `155 libraries and ${Object.keys(frozen(current)).length} frozen old regular inputs/modes unchanged; ONLY parent body drift, original mode retained. Original seal/preimages/69 raw artifacts unchanged HISTORY, not a current all-original-hashes pass.`,
  );
}
