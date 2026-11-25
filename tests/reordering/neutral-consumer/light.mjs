import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { added, leased } from "./scope.mjs";
const attempt = process.argv[2];
if (!/^[a-z0-9-]+$/.test(attempt ?? ""))
  throw Error("Supply unique light attempt name");
const directory = `tests/reordering/neutral-consumer/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Never overwrite prior evidence");
fs.mkdirSync(directory, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "-p",
    "tests/reordering/neutral-consumer/tsconfig.light.json",
    "--pretty",
    "false",
  ],
  { encoding: "utf8" },
);
fs.writeFileSync(
  `${directory}/positive.log`,
  `${result.stdout}${result.stderr}`,
);
console.log(result.stdout, result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
function run(name, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  fs.writeFileSync(
    `${directory}/${name}.log`,
    `${result.stdout}${result.stderr}`,
  );
  console.log(result.stdout, result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("scope", process.execPath, ["tests/reordering/neutral-consumer/scope.mjs"]);
run("static", process.execPath, [
  "tests/reordering/neutral-consumer/static.mjs",
]);
const authored = [];
function walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".artifacts", "preimages"].includes(d.name)) continue;
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p);
    else if (
      /\.(ts|tsx|mjs|json)$/.test(d.name) &&
      !["before.json", "source150-before.json", "handoff-hashes.json"].includes(
        d.name,
      )
    )
      authored.push(p);
  }
}
walk("tests/reordering/neutral-consumer");
run("biome", "node_modules/.bin/biome", [
  "check",
  "--assist-enabled=false",
  ...leased,
  ...added,
  ...authored,
]);
console.log(
  "Own positive source TS6/noEmit/syntax/static/scope/full scoped Biome only; no fixture/module execution",
);
