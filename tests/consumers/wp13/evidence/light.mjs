import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { own, capacity, verifyScope } from "./scope.mjs";
const [action, label] = process.argv.slice(2);
if (
  !/^(?:light|format|biome)-\d+$/.test(label ?? "") ||
  !["light", "format", "biome"].includes(action) ||
  !label.startsWith(`${action}-`)
)
  throw Error("Explicit fresh action label required");
capacity();
verifyScope();
const directory = `${own}/evidence/${label}`;
if (fs.existsSync(directory)) throw Error("Immutable attempt exists");
fs.mkdirSync(directory);
function output(file, bytes) {
  capacity();
  fs.writeFileSync(`${directory}/${file}`, bytes, { flag: "wx" });
}
const results = {};
function run(name, command, args) {
  capacity();
  const value = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 480000,
    maxBuffer: 16 * 1024 * 1024,
  });
  output(
    `${name}.log`,
    `${value.stdout ?? ""}${value.stderr ?? ""}${value.error ? String(value.error) : ""}`,
  );
  results[name] = {
    status: value.status,
    signal: value.signal,
    error: value.error ? String(value.error) : null,
  };
  console.log(
    `${name}: ${JSON.stringify(results[name])}\n${value.stdout ?? ""}${value.stderr ?? ""}`,
  );
}
const code = [];
function visit(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = `${directory}/${item.name}`;
    if (item.name === "evidence") continue;
    if (item.isDirectory()) visit(file);
    else if (/\.(?:mjs|ts|tsx|json|css)$/.test(file)) code.push(file);
  }
}
visit(own);
for (const file of [
  "scope.mjs",
  "static.mjs",
  "light.mjs",
  "inputs.mjs",
  "seal.mjs",
])
  if (fs.existsSync(`${own}/evidence/${file}`))
    code.push(`${own}/evidence/${file}`);
if (action === "light") {
  for (const file of code.filter((file) => file.endsWith(".mjs")))
    run(`syntax-${code.indexOf(file)}`, process.execPath, ["--check", file]);
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
    ...code,
  ]);
output("scope.json", `${JSON.stringify(verifyScope(), null, 2)}\n`);
output("results.json", `${JSON.stringify(results, null, 2)}\n`);
process.exitCode = Object.values(results).some((value) => value.status !== 0)
  ? 1
  : 0;
