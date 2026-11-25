import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { own, sha, entry, capacity, verifyScope } from "./scope.mjs";

const [action, label] = process.argv.slice(2);
if (
  !["capture", "verify"].includes(action) ||
  !/^positive-inputs-\d+$/.test(label ?? "")
)
  throw Error("Explicit pin action and fresh label required");
const root = `${own}/evidence/${label}`;
function verify() {
  const pin = JSON.parse(fs.readFileSync(`${root}/inputs.json`));
  for (const [file, expected] of Object.entries(pin.files))
    if (JSON.stringify(entry(file)) !== JSON.stringify(expected))
      throw Error(`Pinned input drift: ${file}`);
  console.log(
    JSON.stringify({
      inputs: Object.keys(pin.files).length,
      compilerFiles: pin.compilerFiles,
      sha256: sha(fs.readFileSync(`${root}/inputs.json`)),
      scope: verifyScope(),
    }),
  );
}
if (action === "capture") {
  capacity();
  verifyScope();
  if (fs.existsSync(root)) throw Error("Immutable pin exists");
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
        HOME: "/nonexistent-wp13-light-home",
        LANG: "C.UTF-8",
      },
      timeout: 480000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  capacity();
  fs.mkdirSync(root);
  fs.writeFileSync(
    `${root}/list-files.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}`,
    { flag: "wx" },
  );
  if (result.status !== 0 || result.error)
    throw Error("Positive source file inventory failed; raw output retained");
  const listed = result.stdout.trim().split(/\r?\n/),
    files = {};
  if (listed.length < 3 || !listed.every((file) => path.isAbsolute(file)))
    throw Error("Missing compiler file report");
  function add(file) {
    if (
      /(?:^|\/)\.repo(?:\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:pem|key)$/.test(file)
    )
      throw Error("Unsafe pin path");
    const actual = fs.realpathSync(file);
    if (!fs.statSync(actual).isFile()) throw Error("Nonregular pin");
    files[actual] = entry(actual);
  }
  for (const file of listed) add(file);
  function ownFiles(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      if (item.name === "evidence") continue;
      const file = `${directory}/${item.name}`;
      if (item.isDirectory()) ownFiles(file);
      else if (item.isFile()) add(file);
      else throw Error("Owned source symlink");
    }
  }
  ownFiles(own);
  for (const file of [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".npmrc",
    "biome.json",
    "tsconfig.base.json",
    "packages/react/package.json",
    "packages/heroui/package.json",
    "node_modules/typescript/bin/tsc",
    "node_modules/typescript/lib/tsc.js",
    "node_modules/typescript/lib/_tsc.js",
    "node_modules/typescript/lib/typescript.js",
    "node_modules/typescript-5-9/package.json",
    "node_modules/typescript-5-9/bin/tsc",
    "node_modules/@biomejs/biome/package.json",
    "node_modules/@biomejs/biome/bin/biome",
    process.execPath,
  ])
    add(file);
  const biome = path.dirname(
    fs.realpathSync("node_modules/@biomejs/biome/package.json"),
  );
  const binary = path.resolve(
    biome,
    `../cli-${process.platform}-${process.arch}/biome`,
  );
  add(binary);
  add(path.join(path.dirname(binary), "package.json"));
  for (const file of [
    "scope.mjs",
    "static.mjs",
    "light.mjs",
    "inputs.mjs",
    "seal.mjs",
  ])
    add(`${own}/evidence/${file}`);
  const versions = Object.fromEntries(
    [
      "typescript",
      "typescript-5-9",
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "@biomejs/biome",
    ].map((name) => {
      const file = `node_modules/${name}/package.json`;
      add(file);
      return [name, JSON.parse(fs.readFileSync(file)).version];
    }),
  );
  if (versions.typescript !== "6.0.3" || versions["typescript-5-9"] !== "5.9.3")
    throw Error("Compiler version drift");
  capacity();
  fs.writeFileSync(
    `${root}/inputs.json`,
    `${JSON.stringify({ status: "actual-source-positive-inputs-not-consumer-proof", compilerFiles: listed.length, versions, files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) }, null, 2)}\n`,
    { flag: "wx" },
  );
}
verify();
