import fs from "node:fs";
import { spawnSync } from "node:child_process";
const name = process.argv[2];
if (!/^light-\d+$/.test(name ?? ""))
  throw Error("Unique light attempt required");
const directory = `tests/reordering/pretoken-renderer/.artifacts/${name}`;
if (fs.existsSync(directory))
  throw Error("Keep all earlier failures and passes");
fs.mkdirSync(directory, { recursive: true });
let failed = false;
for (const [label, command, args] of [
  [
    "positive",
    process.execPath,
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "tests/reordering/pretoken-renderer/tsconfig.light.json",
      "--pretty",
      "false",
    ],
  ],
  [
    "static",
    process.execPath,
    ["tests/reordering/pretoken-renderer/static.mjs"],
  ],
  ["scope", process.execPath, ["tests/reordering/pretoken-renderer/scope.mjs"]],
]) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  fs.writeFileSync(
    `${directory}/${label}.log`,
    `${result.stdout}${result.stderr}`,
  );
  console.log(
    `${label}: exit${result.status}\n${result.stdout}${result.stderr}`,
  );
  failed ||= result.status !== 0;
}
process.exitCode = failed ? 1 : 0;
