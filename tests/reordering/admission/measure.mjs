import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";

const root = new URL("../../../", import.meta.url);
const own = "tests/reordering/admission/";
const source = "packages/react/src/reordering-controller/";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function files(path) {
  const result = [];
  for (const entry of await readdir(new URL(path, root), {
    withFileTypes: true,
  })) {
    if ([".artifacts", "README.md", "handoff-hashes.json"].includes(entry.name))
      continue;
    const name = `${path}${entry.name}`;
    if (entry.isDirectory()) result.push(...(await files(`${name}/`)));
    else if (entry.isFile()) result.push(name);
  }
  return result;
}
const sourceNames = (await files(source)).sort();
assert.deepEqual(
  sourceNames,
  ["admission", "controller", "index", "types"].map(
    (name) => `${source}${name}.ts`,
  ),
);
const inputs = Object.fromEntries(
  await Promise.all(
    [...sourceNames, ...(await files(own))].sort().map(async (path) => [
      path,
      {
        sha256: hash(await readFile(new URL(path, root))),
        mode: (await stat(new URL(path, root))).mode & 0o777,
      },
    ]),
  ),
);
const sourceFour = Object.fromEntries(
  sourceNames.map((path) => [path, inputs[path]]),
);
const sourceFourAggregate = hash(
  sourceNames.map((path) => `${path}\0${inputs[path].sha256}\n`).join(""),
);
const stageAggregate = hash(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(inputs).map(([path, value]) => [path, value.sha256]),
    ),
  ),
);
const record = {
  status: "authored-provisional-held-for-unpaged-contract",
  canonical145:
    "31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe",
  sourceFourAggregate,
  sourceFour,
  stageAggregate,
  inputs,
};
const output = new URL("./handoff-hashes.json", import.meta.url);
if (process.argv[2] === "seal")
  await writeFile(output, `${JSON.stringify(record, null, 2)}\n`, {
    flag: "wx",
  });
else assert.deepEqual(record, JSON.parse(await readFile(output, "utf8")));
console.log(
  `Four source aggregate ${sourceFourAggregate}; ${Object.keys(inputs).length} own stage inputs ${stageAggregate}. Historical producer seals unchanged; no approval.`,
);
