import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, statfs, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const root = new URL("../../../", import.meta.url),
  own = "tests/workbench/wp11-start-retirement/";
const parent = "apps/example-start-facade/src/application/bootstrap-session.ts";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function paths(directory, artifacts = false) {
  const result = [];
  for (const entry of await readdir(new URL(directory, root), {
    withFileTypes: true,
  })) {
    if (
      entry.name === "handoff-hashes.json" ||
      (!artifacts && entry.name === ".artifacts")
    )
      continue;
    const name = `${directory}${entry.name}`;
    if (entry.isDirectory())
      result.push(...(await paths(`${name}/`, artifacts)));
    else if (entry.isFile()) result.push(name);
  }
  return result;
}
async function measure(path) {
  return {
    sha256: hash(await readFile(new URL(path, root))),
    mode: (await stat(new URL(path, root))).mode & 0o777,
  };
}
const before = JSON.parse(
  await readFile(new URL("./before.json", import.meta.url), "utf8"),
);
assert.equal(
  (await measure(`${own}preimages/bootstrap-session.ts.txt`)).sha256,
  before.protectedInputs[parent].sha256,
);
const capture = process.argv[2] === "seal";
if (capture) {
  const s = await statfs(root);
  assert(s.bavail * s.bsize >= 134217728);
  const oldParent = new URL(
    "./preimages/bootstrap-session.ts.txt",
    import.meta.url,
  ).pathname;
  const changed = spawnSync(
    "diff",
    [
      "-u",
      "--label",
      `before/${parent}`,
      "--label",
      `after/${parent}`,
      oldParent,
      new URL(parent, root).pathname,
    ],
    { encoding: "utf8" },
  );
  assert.equal(changed.status, 1);
  let delta = changed.stdout;
  for (const path of (await paths(own))
    .filter((path) => !path.endsWith("source.delta.patch"))
    .sort()) {
    const result = spawnSync(
      "diff",
      [
        "-u",
        "--label",
        "/dev/null",
        "--label",
        `after/${path}`,
        "/dev/null",
        new URL(path, root).pathname,
      ],
      { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
    );
    assert.equal(result.status, 1, path);
    delta += result.stdout;
  }
  await writeFile(new URL("./source.delta.patch", import.meta.url), delta, {
    flag: "wx",
  });
}
const inputs = Object.fromEntries(
  await Promise.all(
    [parent, ...(await paths(own))]
      .sort()
      .map(async (path) => [path, await measure(path)]),
  ),
);
const artifacts = Object.fromEntries(
  await Promise.all(
    (await paths(`${own}.artifacts/`, true))
      .sort()
      .map(async (path) => [path, await measure(path)]),
  ),
);
const record = {
  status:
    "PROVISIONAL parent-only retirement correction, review28n1/n2 author response NOT closure; generated assembly/all runtime FINAL UNRUN",
  suppliedHead: before.suppliedHead,
  canonical155: before.canonical155,
  oldRegularInputs: Object.keys(before.protectedInputs).length,
  changedOldBodies: [parent],
  original39Aggregate: before.originalSeal.newInputAggregate,
  original69Aggregate: before.originalSeal.artifactAggregate,
  originalSealSHA256: before.originalSeal.sha256,
  newInputAggregate: hash(JSON.stringify(inputs)),
  artifactAggregate: hash(JSON.stringify(artifacts)),
  inputs,
  artifacts,
};
const target = new URL("./handoff-hashes.json", import.meta.url);
if (capture)
  await writeFile(target, `${JSON.stringify(record, null, 2)}\n`, {
    flag: "wx",
  });
else assert.deepEqual(record, JSON.parse(await readFile(target, "utf8")));
console.log(
  `${Object.keys(inputs).length} correction inputs ${record.newInputAggregate}; ${Object.keys(artifacts).length} own preserved raw artifacts ${record.artifactAggregate}; old scope independently verifies ONE parent drift/155 libraries frozen; original39/69 seal is HISTORY unchanged.`,
);
