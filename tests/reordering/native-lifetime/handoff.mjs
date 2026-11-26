import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, writeFile } from "node:fs/promises";

const own = "tests/reordering/native-lifetime";
const artifact = `${own}/.artifacts`;
const production = [
  "packages/heroui/src/filters/criteria-commit-core.ts",
  "packages/heroui/src/table/renderer-commit.ts",
  "packages/heroui/src/table/native-resource-lifetime.ts",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function entry(file) {
  const stat = await lstat(file);
  return {
    mode: stat.mode & 0o111 ? "100755" : "100644",
    sha256: hash(await readFile(file)),
  };
}
const canonicalBytes = await readFile(`${artifact}/canonical145.json`);
assert.equal(
  hash(canonicalBytes),
  "31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe",
);
const canonical = JSON.parse(canonicalBytes);
for (const file of production.slice(0, 2)) {
  const name = file.split("/").at(-1);
  assert.equal(
    hash(await readFile(`${artifact}/${name}.preimage`)),
    canonical[file].sha256,
  );
}
const source146 = {};
for (const file of [
  ...new Set([...Object.keys(canonical), ...production]),
].sort())
  source146[file] = await entry(file);
assert.equal(Object.keys(source146).length, 146);
if (process.argv[2] === "sources") {
  const bytes = `${JSON.stringify(source146, null, 2)}\n`;
  await writeFile(`${artifact}/source146.json`, bytes, { flag: "wx" });
  console.log(
    JSON.stringify({
      source146: hash(bytes),
      production: Object.fromEntries(
        production.map((file) => [file, source146[file]]),
      ),
    }),
  );
} else {
  assert.deepEqual(
    source146,
    JSON.parse(await readFile(`${artifact}/source146.json`, "utf8")),
  );
  async function files(dir) {
    const result = [];
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const file = `${dir}/${item.name}`;
      if (file === `${artifact}/implementation-map.json`) continue;
      if (item.isDirectory()) result.push(...(await files(file)));
      else if (item.isFile()) result.push(file);
    }
    return result;
  }
  const entries = {};
  for (const file of [...production, ...(await files(own))].sort())
    entries[file] = await entry(file);
  const bytes = `${JSON.stringify(entries, null, 2)}\n`;
  if (process.argv[2] === "verify") {
    assert.deepEqual(
      entries,
      JSON.parse(await readFile(`${artifact}/implementation-map.json`, "utf8")),
    );
  } else {
    await writeFile(`${artifact}/implementation-map.json`, bytes, {
      flag: "wx",
    });
  }
  console.log(
    JSON.stringify({ files: Object.keys(entries).length, sha256: hash(bytes) }),
  );
}
