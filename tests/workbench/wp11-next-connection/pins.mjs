import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { own, target, hash, entry, check } from "./scope.mjs";
const [action, label] = process.argv.slice(2);
if (
  !/^positive-inputs-\d+$/.test(label ?? "") ||
  !["capture", "verify"].includes(action)
)
  throw Error("Explicit pin action and unique label required");
check();
const directory = `${own}/.artifacts/${label}`;
if (action === "capture") {
  if (fs.existsSync(directory)) throw Error("Keep old input pins");
  fs.mkdirSync(directory, { recursive: true });
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
    { encoding: "utf8", timeout: 480000, maxBuffer: 16 * 1024 * 1024 },
  );
  fs.writeFileSync(
    `${directory}/list-files.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`,
    { flag: "wx" },
  );
  if (result.status !== 0)
    throw Error("Actual positive input discovery failed");
  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  if (lines.some((file) => !path.isAbsolute(file) || !fs.existsSync(file)))
    throw Error("Unexpected input-list content");
  const files = new Set(
    lines.map((file) => path.relative(process.cwd(), file)),
  );
  for (const file of Object.keys(
    JSON.parse(fs.readFileSync(`${own}/before.json`)),
  ))
    files.add(file);
  for (const file of [
    target,
    "node_modules/typescript/package.json",
    "node_modules/typescript/bin/tsc",
    "node_modules/typescript/lib/tsc.js",
    "node_modules/typescript/lib/_tsc.js",
    "node_modules/typescript/lib/typescript.js",
  ])
    files.add(file);
  for (const file of Object.keys(
    JSON.parse(
      fs.readFileSync(
        "tests/workbench/wp11-next/.artifacts/positive-inputs-001/inputs.json",
      ),
    ),
  ))
    files.add(file);
  function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      if (item.name === ".artifacts") continue;
      const file = `${directory}/${item.name}`;
      if (item.isDirectory()) walk(file);
      else if (item.isFile()) files.add(file);
    }
  }
  walk(own);
  const entries = Object.fromEntries(
    [...files].sort().map((file) => [file, entry(file)]),
  );
  const bytes = `${JSON.stringify(entries, null, 2)}\n`;
  fs.writeFileSync(`${directory}/inputs.json`, bytes, { flag: "wx" });
  const summary = {
    inputs: files.size,
    compilerFiles: lines.length,
    sha256: hash(bytes),
    node: process.version,
    typescript: JSON.parse(
      fs.readFileSync("node_modules/typescript/package.json"),
    ).version,
    scope:
      "Actual positive compiler files, compiler bodies, protected regular and original pinned inspection inputs, own code/receipts; not runtime/native proof",
  };
  fs.writeFileSync(
    `${directory}/summary.json`,
    `${JSON.stringify(summary, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(JSON.stringify(summary));
} else {
  const entries = JSON.parse(fs.readFileSync(`${directory}/inputs.json`));
  for (const [file, expected] of Object.entries(entries))
    if (JSON.stringify(entry(file)) !== JSON.stringify(expected))
      throw Error(`Pinned drift ${file}`);
  console.log(
    `Stable ${Object.keys(entries).length} current compiler/inspection hashes and modes. Historical pinned program has only the disclosed target-body drift.`,
  );
}
