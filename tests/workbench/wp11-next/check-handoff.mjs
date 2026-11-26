import fs from "node:fs";
import { hash } from "./scope.mjs";
const file = "tests/workbench/wp11-next/handoff-hashes.json",
  bytes = fs.readFileSync(file),
  entries = JSON.parse(bytes);
for (const [file, entry] of Object.entries(entries)) {
  if (
    hash(fs.readFileSync(file)) !== entry.sha256 ||
    (fs.statSync(file).mode & 0o777) !== entry.mode
  )
    throw Error(`Handoff drift ${file}`);
}
console.log(
  `Stable${Object.keys(entries).length} sealed handoff inputs; map SHA256 ${hash(bytes)}. Runtime remains UNRUN.`,
);
