import fs from "node:fs";
import { spawnSync } from "node:child_process";
const attempt = process.argv[2];
if (!/^light-\d+$/.test(attempt ?? ""))
  throw Error("Unique LIGHT attempt required");
const directory = `tests/workbench/wp11-next/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Preserve raw old attempts");
fs.mkdirSync(directory, { recursive: true });
let failed = false;
for (const [label, args] of [
  [
    "positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "apps/example-next/tsconfig.light.json",
      "--pretty",
      "false",
    ],
  ],
  ["static", ["tests/workbench/wp11-next/static.mjs"]],
  ["scope", ["tests/workbench/wp11-next/scope.mjs"]],
  [
    "installed",
    [
      "tests/workbench/wp11-next/installed.mjs",
      attempt.replace("light-", "installed-"),
    ],
  ],
]) {
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  fs.writeFileSync(
    `${directory}/${label}.log`,
    `${result.stdout}${result.stderr}`,
    { flag: "wx" },
  );
  console.log(
    `${label}: exit${result.status}\n${result.stdout}${result.stderr}`,
  );
  failed ||= result.status !== 0;
}
process.exitCode = failed ? 1 : 0;
