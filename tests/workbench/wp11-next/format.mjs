import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { allowed } from "./scope.mjs";
const own = "tests/workbench/wp11-next",
  attempt = process.argv[2],
  mode = process.argv[3];
if (
  !/^(format|biome)-\d+$/.test(attempt ?? "") ||
  !["write", "check"].includes(mode)
)
  throw Error("Unique scoped format/biome attempt and write/check required");
const directory = `${own}/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Keep prior logs");
const files = allowed.filter(
  (file) => fs.existsSync(file) && /\.(ts|tsx|mjs|css|json)$/.test(file),
);
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".artifacts", "receipts"].includes(entry.name)) continue;
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walk(file);
    else if (
      /\.(mjs|ts|tsx|json)$/.test(file) &&
      ![
        "before.json",
        "source155-before.json",
        "handoff-hashes.json",
        "source155-after.json",
      ].includes(entry.name)
    )
      files.push(file);
  }
}
walk(own);
fs.mkdirSync(directory, { recursive: true });
const result = spawnSync(
  "node_modules/.bin/biome",
  [
    "check",
    ...(mode === "write" ? ["--write"] : []),
    "--assist-enabled=false",
    ...files,
  ],
  { encoding: "utf8" },
);
fs.writeFileSync(`${directory}/biome.log`, `${result.stdout}${result.stderr}`);
console.log(result.stdout, result.stderr);
process.exitCode = result.status ?? 1;
