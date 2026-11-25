import fs from "node:fs";
import { hash, allowed } from "./scope.mjs";
const own = "tests/workbench/wp11-next";
for (const name of ["source155-after.json", "handoff-hashes.json"])
  if (fs.existsSync(`${own}/${name}`))
    throw Error("Immutable handoff already exists");
const before = fs.readFileSync(`${own}/source155-before.json`);
for (const [file, value] of Object.entries(JSON.parse(before)))
  if (hash(fs.readFileSync(file)) !== value.sha256)
    throw Error(`Frozen source drift ${file}`);
fs.writeFileSync(`${own}/source155-after.json`, before, { flag: "wx" });
const entries = {};
const entry = (file) => ({
  mode: fs.statSync(file).mode & 0o777,
  sha256: hash(fs.readFileSync(file)),
});
function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = `${directory}/${item.name}`;
    if (item.isDirectory()) walk(file);
    else if (item.isFile() && item.name !== "handoff-hashes.json")
      entries[file] = entry(file);
  }
}
walk(own);
for (const file of allowed) {
  if (!fs.existsSync(file))
    throw Error(`Missing selected new app file ${file}`);
  entries[file] = entry(file);
}
const appEntries = Object.fromEntries(
  allowed.map((file) => [file, entry(file)]),
);
const bytes = `${JSON.stringify(Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`;
fs.writeFileSync(`${own}/handoff-hashes.json`, bytes, { flag: "wx" });
console.log(
  JSON.stringify(
    {
      source155: hash(before),
      app16: hash(Buffer.from(`${JSON.stringify(appEntries, null, 2)}\n`)),
      handoffInputs: Object.keys(entries).length,
      handoffSHA256: hash(bytes),
      runtime: "UNRUN",
    },
    null,
    2,
  ),
);
