import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const label = process.argv[2];
assert(label && /^[\w-]+$/.test(label), "Supply a fresh light label");
const root = fileURLToPath(new URL("../../../", import.meta.url));
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const output = new URL(`./.artifacts/${label}/`, import.meta.url);
await mkdir(output);
async function codeFiles(directory) {
  const paths = [];
  for (const entry of await readdir(
    new URL(directory, new URL("../../../", import.meta.url)),
    { withFileTypes: true },
  )) {
    if (
      [".artifacts", "before.json", "handoff-hashes.json"].includes(entry.name)
    )
      continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...(await codeFiles(path)));
    else if (/\.(?:ts|tsx|mjs|json)$/.test(path)) paths.push(path);
  }
  return paths;
}
const commands = [
  [
    "positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "tests/reordering/admission/tsconfig.json",
      "--pretty",
      "false",
    ],
  ],
  ["scope", ["tests/reordering/admission/scope.mjs"]],
  ["static", ["tests/reordering/admission/static.mjs"]],
  ...[
    "light",
    "scope",
    "static",
    "measure",
    "vite.config",
    "vitest.config",
  ].map((name) => [
    `syntax-${name}`,
    ["--check", `tests/reordering/admission/${name}.mjs`],
  ]),
  [
    "biome",
    [
      "node_modules/@biomejs/biome/bin/biome",
      "check",
      "--assist-enabled=false",
      "packages/react/src/reordering-controller",
      ...(await codeFiles("tests/reordering/admission")),
      "--max-diagnostics=40",
    ],
  ],
];
const results = [];
for (const [name, args] of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
  await writeFile(
    new URL(`${name}.log`, output),
    `${result.stdout ?? ""}${result.stderr ?? ""}`,
  );
  results.push({ name, args, status: result.status });
  await writeFile(
    new URL("results.json", output),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  assert.equal(
    result.status,
    0,
    `${name} failed; raw logs ${fileURLToPath(output)}`,
  );
}
console.log(`Allowed light checks passed: ${fileURLToPath(output)}`);
