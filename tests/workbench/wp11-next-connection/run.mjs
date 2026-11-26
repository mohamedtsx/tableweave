import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { own, target, check } from "./scope.mjs";
const [action, label] = process.argv.slice(2);
if (
  !(
    (action === "light" && /^light-\d+$/.test(label ?? "")) ||
    (["format", "biome"].includes(action) &&
      new RegExp(`^${action}-\\d+$`).test(label ?? ""))
  )
)
  throw Error("Unique action/attempt required");
check();
const directory = `${own}/.artifacts/${label}`;
if (fs.existsSync(directory)) throw Error("Never replace raw attempts");
fs.mkdirSync(directory, { recursive: true });
const results = {};
function run(name, command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 480000,
    maxBuffer: 16 * 1024 * 1024,
  });
  const log = `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? `\n${String(result.error)}\n` : ""}`;
  fs.writeFileSync(`${directory}/${name}.log`, log, { flag: "wx" });
  results[name] = {
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error) : null,
  };
  console.log(`${name}: ${JSON.stringify(results[name])}\n${log}`);
}
if (action === "light") {
  run("positive", process.execPath, [
    "node_modules/typescript/bin/tsc",
    "-p",
    `${own}/tsconfig.light.json`,
    "--pretty",
    "false",
  ]);
  run("static", process.execPath, [`${own}/static.mjs`]);
  const report = check();
  fs.writeFileSync(
    `${directory}/scope.json`,
    `${JSON.stringify(report, null, 2)}\n`,
    { flag: "wx" },
  );
  const diff = spawnSync(
    "diff",
    ["-u", `${own}/receipts/client-owner.before.txt`, target],
    { encoding: "utf8" },
  );
  fs.writeFileSync(
    `${directory}/client-owner.diff`,
    `${diff.stdout ?? ""}${diff.stderr ?? ""}`,
    { flag: "wx" },
  );
  if (diff.status !== 1)
    throw Error("Expected one source delta, diff did not complete normally");
} else {
  const files = [
    target,
    ...fs
      .readdirSync(own)
      .filter(
        (name) =>
          /\.(mjs|ts|tsx|json)$/.test(name) &&
          !["before.json", "handoff-hashes.json"].includes(name),
      )
      .map((name) => `${own}/${name}`),
  ];
  run("biome", "node_modules/.bin/biome", [
    "check",
    ...(action === "format" ? ["--write"] : []),
    "--assist-enabled=false",
    ...files,
  ]);
}
fs.writeFileSync(
  `${directory}/results.json`,
  `${JSON.stringify(results, null, 2)}\n`,
  { flag: "wx" },
);
process.exitCode = Object.values(results).some((result) => result.status !== 0)
  ? 1
  : 0;
