import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { own, changed, added, capacity, output, verify } from "./scope.mjs";
const [action, label] = process.argv.slice(2);
if (
  !["format", "biome", "light"].includes(action) ||
  !new RegExp(`^${action}-[0-9]+$`).test(label ?? "")
)
  throw Error("Explicit fresh check label required");
capacity();
verify();
const root = `${own}/evidence/${label}`;
if (fs.existsSync(root)) throw Error("Immutable attempt exists");
fs.mkdirSync(root);
const files = [...changed, ...added];
function visit(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = `${directory}/${item.name}`;
    if (item.isDirectory()) {
      if (item.name !== "evidence") visit(file);
    } else if (/\.(?:mjs|ts|json)$/.test(file)) files.push(file);
  }
}
visit(own);
for (const file of [
  "scope.mjs",
  "static.mjs",
  "check.mjs",
  "pins.mjs",
  "seal.mjs",
])
  if (fs.existsSync(`${own}/evidence/${file}`))
    files.push(`${own}/evidence/${file}`);
const results = {};
function run(name, command, args) {
  capacity();
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 480000,
    maxBuffer: 8 * 1024 * 1024,
  });
  output(
    `${root}/${name}.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`,
  );
  results[name] = {
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error) : null,
  };
  console.log(
    `${name}:${JSON.stringify(results[name])}\n${result.stdout ?? ""}${result.stderr ?? ""}`,
  );
}
if (action === "light") {
  for (const [index, file] of files.entries())
    if (file.endsWith(".mjs"))
      run(`syntax-${index}`, process.execPath, ["--check", file]);
  run("positive", process.execPath, [
    "node_modules/typescript/bin/tsc",
    "-p",
    `${own}/tsconfig.light.json`,
    "--pretty",
    "false",
  ]);
  run("static", process.execPath, [`${own}/evidence/static.mjs`]);
} else
  run("biome", "node_modules/.bin/biome", [
    "check",
    ...(action === "format" ? ["--write"] : []),
    "--assist-enabled=false",
    ...files,
  ]);
output(`${root}/scope.json`, `${JSON.stringify(verify(), null, 2)}\n`);
output(`${root}/results.json`, `${JSON.stringify(results, null, 2)}\n`);
process.exitCode = Object.values(results).every((result) => result.status === 0)
  ? 0
  : 1;
