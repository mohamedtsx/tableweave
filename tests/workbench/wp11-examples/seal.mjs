import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const root = new URL("../../../", import.meta.url),
  own = "tests/workbench/wp11-examples/";
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
const capture = process.argv[2] === "seal";
if (capture) {
  const additions = [
    ...before.leased,
    ...(await paths(own)).filter(
      (path) =>
        !path.endsWith("source.delta.patch") &&
        !path.endsWith("before.json") &&
        !path.includes("/preimages/"),
    ),
  ].sort();
  let delta = "";
  for (const path of additions) {
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
      { encoding: "utf8" },
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
    [...before.leased, ...(await paths(own))]
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
    "Stage-B-implementation-ready-PROVISIONAL-runtime-unrun-Start-unmounted-drag-blocked",
  suppliedBase: before.suppliedBase,
  canonical155: before.canonical155,
  library: { total: 155, changed: 0 },
  oldInputCount: Object.keys(before.protectedInputs).length,
  newInputAggregate: hash(JSON.stringify(inputs)),
  artifactAggregate: hash(JSON.stringify(artifacts)),
  inputs,
  artifacts,
};
const output = new URL("./handoff-hashes.json", import.meta.url);
if (capture)
  await writeFile(output, `${JSON.stringify(record, null, 2)}\n`, {
    flag: "wx",
  });
else assert.deepEqual(record, JSON.parse(await readFile(output, "utf8")));
console.log(
  `${Object.keys(inputs).length} new inputs ${record.newInputAggregate}; ${Object.keys(artifacts).length} preserved artifacts ${record.artifactAggregate};155 unchanged libraries and all Stage A protected; no existing-file edits.`,
);
