import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { hash, allowed, app } from "./scope.mjs";
const own = "tests/workbench/wp11-next",
  attempt = process.argv[2],
  inspection = process.argv[3];
if (
  !/^positive-inputs-\d+$/.test(attempt ?? "") ||
  !/^installed-\d+$/.test(inspection ?? "")
)
  throw Error(
    "Unique positive input pin and exact installed inspection attempt required",
  );
const directory = `${own}/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Never replace input pins");
fs.mkdirSync(directory, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "-p",
    `${app}/tsconfig.light.json`,
    "--listFilesOnly",
    "--pretty",
    "false",
  ],
  { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
);
fs.writeFileSync(
  `${directory}/list-files.log`,
  `${result.stdout}${result.stderr}`,
  { flag: "wx" },
);
if (result.status !== 0) throw Error("Positive file discovery failed");
const files = new Set(
  result.stdout
    .split(/\r?\n/)
    .filter((file) => file && fs.existsSync(file))
    .map((file) => path.relative(process.cwd(), file)),
);
const inspectionFile = `${own}/.artifacts/${inspection}/installed.json`;
for (const entry of Object.values(JSON.parse(fs.readFileSync(inspectionFile))))
  files.add(path.relative(process.cwd(), path.resolve(entry.file)));
files.add(inspectionFile);
files.add(`${own}/.artifacts/${inspection}/new-closure.json`);
for (const file of [
  "tsconfig.base.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
  "biome.json",
  "packages/react/package.json",
  "packages/heroui/package.json",
  `${app}/package.json`,
  "node_modules/typescript/package.json",
  "node_modules/typescript/bin/tsc",
  "node_modules/typescript/lib/tsc.js",
  "node_modules/typescript/lib/_tsc.js",
  "node_modules/typescript/lib/typescript.js",
  ...allowed.filter((file) => fs.existsSync(file)),
  ...[
    "next",
    "@tailwindcss/postcss",
    "react",
    "react-dom",
    "@heroui/react",
    "@heroui/styles",
    "react-aria",
    "react-aria-components",
    "@tanstack/react-table",
    "@internationalized/date",
    "@react-aria/ssr",
    "@react-aria/utils",
    "@types/node",
    "@types/react",
    "@types/react-dom",
  ].map((name) => `${app}/node_modules/${name}/package.json`),
  ...[
    "scope.mjs",
    "static.mjs",
    "installed.mjs",
    "light.mjs",
    "checks.mjs",
    "capture-inputs.mjs",
    "check-inputs.mjs",
    "format.mjs",
  ].map((name) => `${own}/${name}`),
  ...[
    "install-plan.md",
    "installed-inspection.json",
    "lock-review.json",
    "frozen-install.log",
  ].map((name) => `${own}/receipts/${name}`),
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
fs.writeFileSync(`${directory}/inputs.json`, bytes, { flag: "wx" });
const summary = {
  inputs: files.size,
  sha256: hash(bytes),
  typescript: JSON.parse(
    fs.readFileSync("node_modules/typescript/package.json"),
  ).version,
  node: process.version,
  kind: "positive compiler inputs and explicit declaration/manifest/own-source inspection; no module/runtime proof",
};
fs.writeFileSync(
  `${directory}/summary.json`,
  `${JSON.stringify(summary, null, 2)}\n`,
  { flag: "wx" },
);
console.log(JSON.stringify(summary));
