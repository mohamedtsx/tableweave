import fs from "node:fs";
import { spawnSync } from "node:child_process";
const attempt = process.argv[2];
if (!/^light-\d+$/.test(attempt ?? ""))
  throw Error("Unique light attempt required");
const directory = `tests/workbench/wp11-next/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Preserve previous outputs");
fs.mkdirSync(directory, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "-p",
    "apps/example-next/tsconfig.light.json",
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
process.exitCode = result.status ?? 1;
