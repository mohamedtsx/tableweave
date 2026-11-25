import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { added, leased } from "./scope.mjs";
const files = [...leased, ...added];
function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".artifacts", "preimages"].includes(item.name)) continue;
    const file = path.join(directory, item.name);
    if (item.isDirectory()) walk(file);
    else if (
      /\.(mjs|ts|tsx|json)$/.test(item.name) &&
      !["before.json", "source150-before.json", "handoff-hashes.json"].includes(
        item.name,
      )
    )
      files.push(file);
  }
}
const attempt = process.argv[2] ?? "format-001";
if (!/^format-[0-9]+$/.test(attempt))
  throw Error("Use a unique format attempt");
const directory = `tests/reordering/neutral-consumer/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Never replace earlier output");
walk("tests/reordering/neutral-consumer");
const result = spawnSync(
  "node_modules/.bin/biome",
  ["format", "--write", ...files],
  { encoding: "utf8" },
);
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(`${directory}/format.log`, `${result.stdout}${result.stderr}`);
console.log(result.stdout, result.stderr);
process.exitCode = result.status ?? 1;
