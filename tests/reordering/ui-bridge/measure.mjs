import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
const root = new URL("../../../", import.meta.url);
const own = "tests/reordering/ui-bridge/";
const sourcePaths = ["admission", "index", "types"].map(
  (name) => `packages/react/src/reordering-controller/${name}.ts`,
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const baseline = JSON.parse(
  await readFile(new URL("./before.json", import.meta.url), "utf8"),
);
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
const sourceThree = Object.fromEntries(
  await Promise.all(
    sourcePaths.map(async (path) => [
      path,
      {
        before: baseline.preimages[path],
        after: await measure(path),
      },
    ]),
  ),
);
const inputs = Object.fromEntries(
  await Promise.all(
    (await paths(own)).sort().map(async (path) => [path, await measure(path)]),
  ),
);
const sourceAggregate = hash(
  sourcePaths
    .map((path) => `${path}\0${sourceThree[path].after.sha256}\n`)
    .join(""),
);
const inputAggregate = hash(JSON.stringify(inputs));
const record = {
  status: "HELD-PROVISIONAL-UI-reentry-vs-source-observation-seam-blocker",
  suppliedBase: "6f157bf (no worker Git operation)",
  canonical150: baseline.canonical150,
  sourceAggregate,
  sourceThree,
  inputAggregate,
  inputs,
};
const output = new URL("./handoff-hashes.json", import.meta.url);
if (process.argv[2] === "seal")
  await writeFile(output, `${JSON.stringify(record, null, 2)}\n`, {
    flag: "wx",
  });
else assert.deepEqual(record, JSON.parse(await readFile(output, "utf8")));
console.log(
  `UI bridge source3 ${sourceAggregate}; ${Object.keys(inputs).length} own inputs ${inputAggregate}; historical seals not replaced.`,
);
