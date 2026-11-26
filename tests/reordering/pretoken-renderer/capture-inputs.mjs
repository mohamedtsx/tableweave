import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const root = "tests/reordering/pretoken-renderer",
  name = process.argv[2];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (!/^positive-inputs-\d+$/.test(name ?? ""))
  throw Error("Unique input ledger name required");
const directory = `${root}/.artifacts/${name}`;
if (fs.existsSync(directory)) throw Error("Never replace input ledgers");
fs.mkdirSync(directory, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "-p",
    `${root}/tsconfig.light.json`,
    "--listFilesOnly",
    "--pretty",
    "false",
  ],
  { encoding: "utf8" },
);
fs.writeFileSync(
  `${directory}/list-files.log`,
  `${result.stdout}${result.stderr}`,
);
if (result.status !== 0) throw Error("Positive input discovery failed");
const files = new Set(
  result.stdout
    .split(/\r?\n/)
    .filter((file) => file && fs.existsSync(file))
    .map((file) => path.relative(process.cwd(), file)),
);
for (const file of [
  "tsconfig.base.json",
  `${root}/tsconfig.light.json`,
  "tests/reordering/neutral-consumer/tsconfig.light.json",
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "biome.json",
  "packages/react/package.json",
  "packages/heroui/package.json",
  "node_modules/typescript/package.json",
  "packages/heroui/node_modules/@heroui/react/package.json",
  ...["button", "dropdown", "table"].flatMap((component) =>
    ["js", "d.ts"].map(
      (ext) =>
        `packages/heroui/node_modules/@heroui/react/dist/components/${component}/${component}.${ext}`,
    ),
  ),
])
  files.add(file);
const entries = Object.fromEntries(
  [...files].sort().map((file) => [
    file,
    {
      mode: fs.statSync(file).mode & 0o777,
      sha256: hash(fs.readFileSync(file)),
    },
  ]),
);
const bytes = `${JSON.stringify(entries, null, 2)}\n`;
fs.writeFileSync(`${directory}/inputs.json`, bytes);
console.log(
  JSON.stringify({
    files: files.size,
    sha256: hash(bytes),
    typescript: JSON.parse(
      fs.readFileSync("node_modules/typescript/package.json"),
    ).version,
  }),
);
