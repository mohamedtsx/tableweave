import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const own = fileURLToPath(new URL("./", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
mkdirSync(join(own, ".artifacts"), { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    join(root, "node_modules/typescript/bin/tsc"),
    "-p",
    join(own, "tsconfig.light.json"),
    "--pretty",
    "false",
  ],
  { cwd: root, encoding: "utf8" },
);
if (result.error) throw result.error;
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
writeFileSync(join(own, ".artifacts/light-ts6.log"), output, { flag: "wx" });
writeFileSync(
  join(own, ".artifacts/light-ts6.json"),
  JSON.stringify(
    {
      status: result.status,
      scope: "single TS6 source package + positive fixture noEmit only",
      negatives: false,
      runtimeTests: false,
      emission: false,
    },
    null,
    2,
  ),
  { flag: "wx" },
);
process.stdout.write(output);
console.log(`Light TS6 status: ${result.status}`);
process.exit(result.status ?? 1);
