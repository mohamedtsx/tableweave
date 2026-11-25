import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const attempt = process.argv[2] ?? "positive-inputs";
if (!/^positive-inputs(?:-[0-9]+)?$/.test(attempt))
  throw Error("Use a fresh positive input ledger name");
const directory = `tests/reordering/neutral-consumer/.artifacts/${attempt}`;
if (fs.existsSync(directory))
  throw Error("Immutable positive input ledger already exists");
fs.mkdirSync(directory, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "-p",
    "tests/reordering/neutral-consumer/tsconfig.light.json",
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
if (result.status !== 0)
  throw Error("Positive input discovery failed; retain its log");
const files = new Set(
  result.stdout
    .split(/\r?\n/)
    .filter((file) => file && fs.existsSync(file))
    .map((file) => path.relative(process.cwd(), path.resolve(file))),
);
for (const file of [
  "tsconfig.base.json",
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
      (extension) =>
        `packages/heroui/node_modules/@heroui/react/dist/components/${component}/${component}.${extension}`,
    ),
  ),
])
  files.add(file);
const entries = Object.fromEntries(
  [...files].sort().map((file) => [
    file,
    {
      mode: fs.statSync(file).mode & 0o777,
      sha256: createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
    },
  ]),
);
const bytes = `${JSON.stringify(entries, null, 2)}\n`;
fs.writeFileSync(`${directory}/inputs.json`, bytes);
console.log(
  JSON.stringify({
    inputs: Object.keys(entries).length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    typeScript: JSON.parse(
      fs.readFileSync("node_modules/typescript/package.json"),
    ).version,
  }),
);
