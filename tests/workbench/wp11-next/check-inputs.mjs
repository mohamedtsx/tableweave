import fs from "node:fs";
import { hash } from "./scope.mjs";
const attempt = process.argv[2];
if (!/^positive-inputs-\d+$/.test(attempt ?? ""))
  throw Error("Select exact immutable input pin");
const entries = JSON.parse(
  fs.readFileSync(
    `tests/workbench/wp11-next/.artifacts/${attempt}/inputs.json`,
  ),
);
for (const [file, expected] of Object.entries(entries))
  if (
    hash(fs.readFileSync(file)) !== expected.sha256 ||
    (fs.statSync(file).mode & 0o777) !== expected.mode
  )
    throw Error(`Positive input drift ${file}`);
console.log(
  `Stable${Object.keys(entries).length} positive-program/inspection hashes and modes`,
);
