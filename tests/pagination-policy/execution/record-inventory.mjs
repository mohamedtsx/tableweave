import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { own, snapshot } from "./guard.mjs";

// Supplement the strict whole-inventory guard, never replace/rebase its baseline.
const before = JSON.parse(
  await readFile(join(own, ".artifacts/protected-before.json"), "utf8"),
);
const current = await snapshot();
const changed = Object.keys(before).filter(
  (file) => current[file] !== before[file],
);
const added = Object.fromEntries(
  Object.entries(current).filter(([file]) => !Object.hasOwn(before, file)),
);
const report = {
  protectedFiles: Object.keys(before).length,
  originalProtectedBytesUnchanged: changed.length === 0,
  changedOrRemovedOriginalPaths: changed,
  fullInventoryUnchanged:
    changed.length === 0 && Object.keys(added).length === 0,
  additionalPathsNotWrittenByThisWorker: added,
  baselineRebased: false,
};
await writeFile(
  join(own, ".artifacts/inventory-delta.json"),
  JSON.stringify(report, null, 2),
);
assert.deepEqual(
  changed,
  [],
  "An original protected input changed or disappeared",
);
console.log(JSON.stringify(report, null, 2));
