import fs from "node:fs";
import { createHash } from "node:crypto";
import { leased, added } from "./scope.mjs";
const root = "tests/reordering/pretoken-renderer",
  hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const file of [
  "source155-after.json",
  "source-delta.json",
  "handoff-hashes.json",
])
  if (fs.existsSync(`${root}/${file}`))
    throw Error("Immutable final seal already exists");
const before = JSON.parse(fs.readFileSync(`${root}/source155-before.json`));
const originals = JSON.parse(fs.readFileSync(`${root}/before.json`));
const source = Object.fromEntries(
  Object.keys(before)
    .sort()
    .map((file) => [
      file,
      { mode: before[file].mode, sha256: hash(fs.readFileSync(file)) },
    ]),
);
for (const file of added)
  if (fs.existsSync(file))
    source[file] = { mode: "100644", sha256: hash(fs.readFileSync(file)) };
const delta = Object.fromEntries(
  [...leased, ...added.filter((file) => fs.existsSync(file))]
    .sort()
    .map((file) => [
      file,
      {
        before: before[file] ?? null,
        after: source[file],
        linuxMode: fs.statSync(file).mode & 0o777,
        beforeLinuxMode: originals[file]?.mode ?? null,
      },
    ]),
);
const sourceBytes = `${JSON.stringify(source, null, 2)}\n`,
  deltaBytes = `${JSON.stringify(delta, null, 2)}\n`;
fs.writeFileSync(`${root}/source155-after.json`, sourceBytes);
fs.writeFileSync(`${root}/source-delta.json`, deltaBytes);
const own = {};
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && entry.name !== "handoff-hashes.json")
      own[file] = {
        mode: fs.statSync(file).mode & 0o777,
        sha256: hash(fs.readFileSync(file)),
      };
  }
}
walk(root);
for (const file of Object.keys(delta))
  own[file] = {
    mode: fs.statSync(file).mode & 0o777,
    sha256: source[file].sha256,
  };
const bytes = `${JSON.stringify(Object.fromEntries(Object.entries(own).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`;
fs.writeFileSync(`${root}/handoff-hashes.json`, bytes);
console.log(
  JSON.stringify(
    {
      sources: Object.keys(source).length,
      source155: hash(sourceBytes),
      delta18: hash(deltaBytes),
      handoffFiles: Object.keys(own).length,
      handoff: hash(bytes),
      changed: Object.entries(source)
        .filter(([file, value]) => value.sha256 !== before[file]?.sha256)
        .map(([file]) => file),
    },
    null,
    2,
  ),
);
