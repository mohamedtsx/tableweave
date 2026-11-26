import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";

const root = new URL("../../../", import.meta.url);
const own = "tests/reordering/unpaged-extent/";
const sources = [
  "packages/react/src/reordering-controller/admission.ts",
  "packages/react/src/reordering/capture.ts",
  "packages/react/src/reordering/types.ts",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalBytes = await readFile(
  "/tmp/opencode/wp10-after-held-admission-source149.json",
);
assert.equal(
  hash(canonicalBytes),
  "c49ff0b5a5ffae020fbdef637a037fcd5ccf038b5831a9a62fa81876469f6689",
);
const canonical = JSON.parse(canonicalBytes);
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
async function measure(path) {
  return {
    sha256: hash(await readFile(new URL(path, root))),
    mode: (await stat(new URL(path, root))).mode & 0o777,
  };
}
const sourceThree = Object.fromEntries(
  await Promise.all(
    sources.map(async (path) => [
      path,
      {
        before: canonical[path],
        after: await measure(path),
      },
    ]),
  ),
);
for (const [path, value] of Object.entries(sourceThree)) {
  assert.notEqual(value.before.sha256, value.after.sha256, path);
  assert.equal(
    value.before.mode,
    value.after.mode & 0o111 ? "100755" : "100644",
    path,
  );
}
const inputs = Object.fromEntries(
  await Promise.all(
    (await paths(own)).sort().map(async (path) => [path, await measure(path)]),
  ),
);
const sourceThreeAggregate = hash(
  sources
    .map((path) => `${path}\0${sourceThree[path].after.sha256}\n`)
    .join(""),
);
const inputAggregate = hash(JSON.stringify(inputs));
const record = {
  status:
    "U1-compatibility-source-ready-provisional-runtime-independent-unverified",
  suppliedBase: "e9d1721 (no worker Git operation)",
  canonical149: hash(canonicalBytes),
  sourceThreeAggregate,
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
  `U1 three-source aggregate ${sourceThreeAggregate}; ${Object.keys(inputs).length} own inputs ${inputAggregate}. Distinct current-lane map; historical seals remain unchanged.`,
);
