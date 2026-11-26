import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { added, leased } from "./scope.mjs";
const directory = "tests/reordering/neutral-consumer";
const destination = `${directory}/handoff-hashes.json`;
if (fs.existsSync(destination))
  throw Error("Never replace an earlier handoff seal");
const digest = (value) => createHash("sha256").update(value).digest("hex");
const entry = (file) => ({
  mode: fs.statSync(file).mode & 0o777,
  sha256: digest(fs.readFileSync(file)),
});
const baseline = JSON.parse(
  fs.readFileSync(`${directory}/source150-before.json`),
);
const source = Object.fromEntries(
  [...Object.keys(baseline), ...added].sort().map((file) => [
    file,
    {
      mode: fs.statSync(file).mode & 0o111 ? "100755" : "100644",
      sha256: entry(file).sha256,
    },
  ]),
);
const bytes = `${JSON.stringify(source, null, 2)}\n`;
const sourcePath = `${directory}/.artifacts/source155.json`;
if (fs.existsSync(sourcePath)) throw Error("Never replace source155");
fs.writeFileSync(sourcePath, bytes);
const inputs = Object.fromEntries(
  [...leased, ...added].sort().map((file) => [file, entry(file)]),
);
function walk(folder) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) walk(file);
    else if (item.isFile() && file !== destination) inputs[file] = entry(file);
  }
}
walk(directory);
const delta = Object.fromEntries(
  [...leased, ...added].sort().map((file) => [file, entry(file)]),
);
const aggregate = digest(
  Object.entries(delta)
    .map(([file, value]) => `${file}\0${value.sha256}\n`)
    .join(""),
);
const result = {
  status: "PROVISIONAL-NEUTRAL-CONSUMER-ROW-TERMINAL-HELD",
  base: "dda8166",
  source150BeforeSHA256:
    "39adeb5db9bfb8d7b772d4cd67097741c3a34205a6e62edd6a9ceb77a45caaa4",
  source155SHA256: digest(bytes),
  source16Aggregate: aggregate,
  source16: delta,
  inputs,
};
fs.writeFileSync(destination, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  JSON.stringify({
    status: result.status,
    source155SHA256: result.source155SHA256,
    source16Aggregate: aggregate,
    ownInputs: Object.keys(inputs).length,
    handoffSHA256: entry(destination).sha256,
  }),
);
