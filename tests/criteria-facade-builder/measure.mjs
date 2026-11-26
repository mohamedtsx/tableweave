import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const directory = new URL("./", import.meta.url);
const source = "packages/heroui/src/filters/criteria-builder-host.tsx";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const before = JSON.parse(
  await readFile(new URL("./before.json", import.meta.url), "utf8"),
);
async function files(base, prefix = "tests/criteria-facade-builder/") {
  const paths = [];
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if ([".artifacts", "README.md", "handoff-hashes.json"].includes(entry.name))
      continue;
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory())
      paths.push(...(await files(new URL(`${entry.name}/`, base), `${path}/`)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}
const inputs = Object.fromEntries(
  await Promise.all(
    [source, ...(await files(directory))].sort().map(async (path) => [
      path,
      {
        sha256: hash(await readFile(new URL(path, root))),
        mode: (await stat(new URL(path, root))).mode & 0o777,
      },
    ]),
  ),
);
const aggregate = hash(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(inputs).map(([path, value]) => [path, value.sha256]),
    ),
  ),
);
const seal = {
  canonical137: before.canonicalHash,
  beforeHost: before.source.sha256,
  afterHost: inputs[source].sha256,
  aggregate,
  inputs,
};
const output = new URL("./handoff-hashes.json", import.meta.url);
if (process.argv[2] === "seal")
  await writeFile(output, `${JSON.stringify(seal, null, 2)}\n`, { flag: "wx" });
else assert.deepEqual(seal, JSON.parse(await readFile(output, "utf8")));
console.log(
  `${Object.keys(inputs).length} stage inputs measured; host ${seal.afterHost}; aggregate ${aggregate}. Old producer/format/Date/S3 seals are unchanged history.`,
);
