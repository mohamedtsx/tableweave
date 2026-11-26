// FINAL PHASE ONLY; never part of positive LIGHT execution.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../../", import.meta.url));
const output = new URL("../.artifacts/negative/", import.meta.url);
await mkdir(output);
const args = [
  "node_modules/typescript/bin/tsc",
  "-p",
  "tests/workbench/wp11-examples/negative/tsconfig.json",
  "--pretty",
  "false",
];
const result = spawnSync(process.execPath, args, {
  cwd: root,
  encoding: "utf8",
});
const diagnostics = `${result.stdout ?? ""}${result.stderr ?? ""}`;
await writeFile(new URL("ts6.log", output), diagnostics, { flag: "wx" });
await writeFile(
  new URL("result.json", output),
  `${JSON.stringify({ args, status: result.status }, null, 2)}\n`,
  { flag: "wx" },
);
assert.equal(result.status, 2);
const lines = diagnostics
  .split("\n")
  .filter((line) => /error TS\d+/.test(line));
assert.equal(
  lines.length,
  2,
  "No incidental missing-peer or unrelated errors count as negative proof",
);
assert(
  lines.every((line) =>
    line.startsWith("tests/workbench/wp11-examples/negative/types.ts("),
  ),
);
assert(
  lines.some((line) => /TS(2322|2375)/.test(line)) &&
    lines.some((line) => /TS2540/.test(line)),
);
console.log(
  "Exactly the two authored negative declaration boundaries rejected; no runtime or archive proof.",
);
