import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url),
  own = new URL("./", import.meta.url),
  source = "packages/heroui/src/date/criteria-date-state.tsx";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
async function walk(directory) {
  const paths = [];
  for (const child of await readdir(directory, { withFileTypes: true })) {
    if (
      child.name.startsWith(".") ||
      child.name === "README.md" ||
      child.name === "handoff-hashes.json"
    )
      continue;
    const path = new URL(
      `${child.name}${child.isDirectory() ? "/" : ""}`,
      directory,
    );
    if (child.isDirectory()) paths.push(...(await walk(path)));
    else if (child.isFile()) paths.push(path.href.slice(root.href.length));
  }
  return paths;
}
const fixtures = (await walk(own)).sort(),
  paths = [source, ...fixtures].sort();
const files = Object.fromEntries(
  await Promise.all(
    paths.map(async (path) => [
      path,
      sha256(await readFile(new URL(path, root))),
    ]),
  ),
);
const value = {
  source: {
    path: source,
    before: "c504fa002f2f0d61fb1932f9511a3e66fa82b8a7073f1ad937048566fcab814c",
    after: files[source],
  },
  originalSourceMapSha256:
    "8281387f44e3ef1e0392159d329e05c7a5e0d319311f42b673beaa923ceee1e2",
  aggregateSha256: sha256(JSON.stringify(files)),
  files,
};
const manifest = new URL("./handoff-hashes.json", import.meta.url);
if (process.argv[2] === "record")
  await writeFile(manifest, `${JSON.stringify(value, null, 2)}\n`);
else
  assert.deepEqual(
    value,
    JSON.parse(await readFile(manifest, "utf8")),
    "Current one-source/own fixture seal",
  );
console.log(
  JSON.stringify({
    mode: process.argv[2] === "record" ? "record" : "check",
    source: value.source,
    aggregateSha256: value.aggregateSha256,
    ownFixtureEvidenceFiles: fixtures.length,
    totalMeasured: paths.length,
    excludes: ["README.md", "handoff-hashes.json", ".artifacts"],
  }),
);
