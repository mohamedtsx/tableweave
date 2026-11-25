import fs from "node:fs";
import { spawnSync } from "node:child_process";
const attempt = process.argv[2];
if (!/^[a-z0-9-]+$/.test(attempt ?? ""))
  throw Error("Use a unique light attempt");
const directory = `tests/reordering/pretoken-renderer/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Preserve prior outputs");
fs.mkdirSync(directory, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "-p",
    "tests/reordering/pretoken-renderer/tsconfig.light.json",
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
console.log(
  "Own positive TS6/noEmit only; no production or fixture module executed",
);
