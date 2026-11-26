import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { capacity, root, own, changed, files } from "./scope.mjs";
const label = process.argv[2];
assert(/^format-[0-9]{3}$/.test(label));
await capacity();
const output = `${own}evidence/${label}/`;
await mkdir(resolve(root, output), { recursive: false });
const supported = [
  ...changed,
  ...(await files(own)).filter(
    (path) =>
      !path.startsWith(`${own}evidence/`) && /\.(ts|mjs|json)$/.test(path),
  ),
];
const args = [
  "node_modules/@biomejs/biome/bin/biome",
  "format",
  "--write",
  ...supported,
];
const result = spawnSync(process.execPath, args, {
  cwd: root,
  encoding: "utf8",
  timeout: 300000,
});
await capacity();
await writeFile(
  resolve(root, `${output}format.log`),
  `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`,
  { flag: "wx" },
);
await writeFile(
  resolve(root, `${output}result.json`),
  `${JSON.stringify({ command: [process.execPath, ...args], status: result.status, signal: result.signal, supported }, null, 2)}\n`,
  { flag: "wx" },
);
assert.equal(result.status, 0, `${output}format.log`);
