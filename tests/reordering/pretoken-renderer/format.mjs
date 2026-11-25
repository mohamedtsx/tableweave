import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { leased, added } from "./scope.mjs";
const root = "tests/reordering/pretoken-renderer";
const files = [...leased, ...added.filter((file) => fs.existsSync(file))];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".artifacts", "preimages"].includes(entry.name)) continue;
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walk(file);
    else if (
      /\.(?:mjs|ts|tsx|json)$/.test(file) &&
      !/(?:before|handoff-hashes|source155-after|source-delta)\.json$/.test(
        file,
      )
    )
      files.push(file);
  }
}
walk(root);
const attempt = process.argv[2],
  mode = process.argv[3];
if (
  !/^(?:format|biome)-\d+$/.test(attempt ?? "") ||
  !["write", "check"].includes(mode)
)
  throw Error("Unique scoped format/biome attempt and write/check required");
const directory = `${root}/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Preserve earlier logs");
fs.mkdirSync(directory, { recursive: true });
const result = spawnSync(
  "node_modules/.bin/biome",
  mode === "write"
    ? ["check", "--write", "--assist-enabled=false", ...files]
    : ["check", "--assist-enabled=false", ...files],
  { encoding: "utf8" },
);
fs.writeFileSync(`${directory}/biome.log`, `${result.stdout}${result.stderr}`);
console.log(result.stdout, result.stderr);
process.exitCode = result.status ?? 1;
