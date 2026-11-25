import fs from "node:fs";
import { createHash } from "node:crypto";
const name = process.argv[2];
if (!/^positive-inputs-\d+$/.test(name ?? ""))
  throw Error("Select exact ledger");
const directory = "tests/reordering/pretoken-renderer/.artifacts";
const files = JSON.parse(fs.readFileSync(`${directory}/${name}/inputs.json`));
for (const [file, expected] of Object.entries(files)) {
  const actual = {
    mode: fs.statSync(file).mode & 0o777,
    sha256: createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  };
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw Error(`Pinned input changed: ${file}`);
}
console.log(
  `Stable${Object.keys(files).length} exact positive-program/pinned-inspection hashes and modes`,
);
