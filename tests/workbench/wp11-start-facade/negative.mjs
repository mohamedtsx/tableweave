// FINAL only. Deliberate boundary rejection is NOT positive SOURCE LIGHT.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, statfs, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const compiler = process.argv[2] ?? "typescript";
assert(["typescript", "typescript-5-9"].includes(compiler));
const s = await statfs(root);
assert(s.bavail * s.bsize >= 134217728);
const output = new URL(`./.artifacts/negative-${compiler}/`, import.meta.url);
await mkdir(output);
const args = [
  `node_modules/${compiler}/bin/tsc`,
  "-p",
  "tests/workbench/wp11-start-facade/final/tsconfig.negative.json",
  "--pretty",
  "false",
];
const result = spawnSync(process.execPath, args, {
  cwd: root,
  encoding: "utf8",
});
const diagnostics = `${result.stdout ?? ""}${result.stderr ?? ""}`;
await writeFile(new URL("compiler.log", output), diagnostics, { flag: "wx" });
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
  "No missing-peer or incidental failure counts as a boundary pass",
);
assert(
  lines.every((line) =>
    line.startsWith("tests/workbench/wp11-start-facade/final/negative.ts("),
  ),
);
assert(
  lines.some((line) => /TS(2739|2740)/.test(line)) &&
    lines.some((line) => /TS2322/.test(line)),
);
console.log(
  "Exactly the two intended negative boundaries rejected; no framework/runtime/archive proof.",
);
