import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
const root = new URL("../../../", import.meta.url),
  own = "tests/reordering/interaction-cut/";
const sources = [
  "packages/react/src/reordering-controller/admission.ts",
  "packages/react/src/reordering-controller/index.ts",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function measure(path) {
  return {
    sha256: hash(await readFile(new URL(path, root))),
    mode: (await stat(new URL(path, root))).mode & 0o777,
  };
}
async function paths(directory) {
  const result = [];
  for (const entry of await readdir(new URL(directory, root), {
    withFileTypes: true,
  })) {
    if ([".artifacts", "README.md", "handoff-hashes.json"].includes(entry.name))
      continue;
    const path = `${directory}${entry.name}`;
    if (entry.isDirectory()) result.push(...(await paths(`${path}/`)));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}
const baseline = JSON.parse(
  await readFile(new URL("./before.json", import.meta.url), "utf8"),
);
const sourceDelta = Object.fromEntries(
  await Promise.all(
    sources.map(async (path) => [
      path,
      { before: baseline.preimages[path], after: await measure(path) },
    ]),
  ),
);
const inputs = Object.fromEntries(
  await Promise.all(
    (await paths(own)).sort().map(async (path) => [path, await measure(path)]),
  ),
);
const record = {
  status: "C1a-implementation-ready-PROVISIONAL-C1b-review22n2-open",
  suppliedBase: "dda8166 (no worker Git operation)",
  canonical150: baseline.canonical150,
  sourceDelta,
  sourceAggregate: hash(
    sources
      .map((path) => `${path}\0${sourceDelta[path].after.sha256}\n`)
      .join(""),
  ),
  inputAggregate: hash(JSON.stringify(inputs)),
  inputs,
};
const output = new URL("./handoff-hashes.json", import.meta.url);
if (process.argv[2] === "seal")
  await writeFile(output, `${JSON.stringify(record, null, 2)}\n`, {
    flag: "wx",
  });
else assert.deepEqual(record, JSON.parse(await readFile(output, "utf8")));
console.log(
  `C1a source2 ${record.sourceAggregate}; ${Object.keys(inputs).length} own inputs ${record.inputAggregate}. No historical B2/dda seal re-signed.`,
);
