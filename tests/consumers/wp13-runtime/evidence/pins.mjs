import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  own,
  changed,
  added,
  entry,
  hash,
  output,
  verify,
  capacity,
} from "./scope.mjs";
const [action, label] = process.argv.slice(2);
if (
  !["capture", "verify"].includes(action) ||
  !/^inputs-[0-9]+$/.test(label ?? "")
)
  throw Error("Explicit new follow-up pin label required");
const root = `${own}/evidence/${label}`;
if (action === "capture") {
  capacity();
  verify();
  if (fs.existsSync(root)) throw Error("Immutable pin exists");
  fs.mkdirSync(root);
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      `${own}/tsconfig.light.json`,
      "--listFilesOnly",
      "--pretty",
      "false",
    ],
    {
      encoding: "utf8",
      env: {
        PATH: path.dirname(process.execPath),
        HOME: "/nonexistent-wp13-runtime-light-home",
        LANG: "C.UTF-8",
      },
      timeout: 480000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  output(`${root}/program.log`, `${result.stdout ?? ""}${result.stderr ?? ""}`);
  if (result.status !== 0 || result.error)
    throw Error("E_POSITIVE_PROGRAM_INVENTORY");
  const listed = result.stdout.trim().split(/\r?\n/),
    files = {};
  if (listed.length < 4 || !listed.every((file) => path.isAbsolute(file)))
    throw Error("E_PROGRAM_LIST");
  function add(file) {
    if (
      /(?:^|\/)\.repo(?:\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:pem|key)$/.test(file)
    )
      throw Error("E_PIN_PATH");
    const actual = fs.realpathSync(file);
    files[actual] = entry(actual);
  }
  for (const file of listed) add(file);
  for (const file of [
    ...changed,
    ...added,
    process.execPath,
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".npmrc",
    "tsconfig.base.json",
    "biome.json",
  ])
    add(file);
  function visit(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = `${directory}/${item.name}`;
      if (item.isDirectory()) {
        if (item.name !== "evidence") visit(file);
      } else if (item.isFile()) add(file);
      else throw Error("E_PIN_SOURCE_LINK");
    }
  }
  visit(own);
  for (const file of [
    "scope.mjs",
    "check.mjs",
    "static.mjs",
    "pins.mjs",
    "seal.mjs",
  ])
    add(`${own}/evidence/${file}`);
  const versions = {};
  for (const name of [
    "typescript",
    "typescript-5-9",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "@playwright/test",
    "@biomejs/biome",
  ]) {
    const file = `node_modules/${name}/package.json`;
    add(file);
    versions[name] = JSON.parse(fs.readFileSync(file)).version;
  }
  if (
    versions.typescript !== "6.0.3" ||
    versions["typescript-5-9"] !== "5.9.3" ||
    versions["@playwright/test"] !== "1.65.1"
  )
    throw Error("E_PIN_VERSION");
  for (const file of [
    "node_modules/typescript/bin/tsc",
    "node_modules/typescript/lib/tsc.js",
    "node_modules/typescript/lib/_tsc.js",
    "node_modules/typescript/lib/typescript.js",
    "node_modules/typescript-5-9/bin/tsc",
    "node_modules/@biomejs/biome/bin/biome",
  ])
    add(file);
  const biome = path.dirname(
    fs.realpathSync("node_modules/@biomejs/biome/package.json"),
  );
  add(path.resolve(biome, `../cli-${process.platform}-${process.arch}/biome`));
  output(
    `${root}/pin.json`,
    `${JSON.stringify({ status: "follow-up-current-positive-source-inputs-not-runtime-proof", compilerFiles: listed.length, versions, files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) }, null, 2)}\n`,
  );
}
const pin = JSON.parse(fs.readFileSync(`${root}/pin.json`));
for (const [file, value] of Object.entries(pin.files))
  if (JSON.stringify(entry(file)) !== JSON.stringify(value))
    throw Error(`E_PIN_DRIFT:${file}`);
console.log(
  JSON.stringify({
    inputs: Object.keys(pin.files).length,
    compilerFiles: pin.compilerFiles,
    sha256: hash(fs.readFileSync(`${root}/pin.json`)),
    scope: verify(),
  }),
);
