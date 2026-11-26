import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const label = process.argv[2];
assert(label && /^[a-zA-Z0-9_-]+$/.test(label), "Supply a fresh light label");
const root = fileURLToPath(new URL("../../", import.meta.url));
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const directory = new URL(`./.artifacts/${label}/`, import.meta.url);
await mkdir(directory);
const commands = [
  [
    "own-positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "tests/criteria-facade-builder/tsconfig.json",
      "--pretty",
      "false",
    ],
  ],
  [
    "builder-positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "tests/criteria-builder/tsconfig.json",
      "--pretty",
      "false",
    ],
  ],
  [
    "s3-positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "tests/criteria-facade-config/tsconfig.light.json",
      "--pretty",
      "false",
    ],
  ],
  ["static", ["tests/criteria-facade-builder/static.mjs"]],
  ["scope", ["tests/criteria-facade-builder/scope.mjs"]],
  [
    "format-lint",
    [
      "node_modules/@biomejs/biome/bin/biome",
      "check",
      "--assist-enabled=false",
      "packages/heroui/src/filters/criteria-builder-host.tsx",
      "tests/criteria-facade-builder",
      "--max-diagnostics=40",
    ],
  ],
  ...["scope", "static", "light", "measure"].map((name) => [
    `syntax-${name}`,
    ["--check", `tests/criteria-facade-builder/${name}.mjs`],
  ]),
];
const results = [];
for (const [name, args] of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
  await writeFile(
    new URL(`${name}.log`, directory),
    `${result.stdout ?? ""}${result.stderr ?? ""}`,
  );
  results.push({
    name,
    command: [process.execPath, ...args],
    status: result.status,
  });
  await writeFile(
    new URL("results.json", directory),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  assert.equal(
    result.status,
    0,
    `${name} failed; raw log: ${fileURLToPath(directory)}`,
  );
  if (result.error) throw result.error;
}
console.log(`Light checks passed; raw logs: ${fileURLToPath(directory)}`);
