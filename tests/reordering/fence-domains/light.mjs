import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/reordering/fence-domains/";
const label = process.argv[2];
assert(label && /^[\w-]+$/.test(label), "Supply a fresh LIGHT label");
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const output = new URL(`./.artifacts/${label}/`, import.meta.url);
await mkdir(output);
async function files(path) {
  const names = [];
  for (const entry of await readdir(`${root}/${path}`, {
    withFileTypes: true,
  })) {
    if (
      [
        ".artifacts",
        "preimages",
        "before.json",
        "handoff-hashes.json",
      ].includes(entry.name)
    )
      continue;
    const name = `${path}${entry.name}`;
    if (entry.isDirectory()) names.push(...(await files(`${name}/`)));
    else if (/\.(ts|tsx|mjs|json)$/.test(name)) names.push(name);
  }
  return names;
}
const commands = [
  [
    "positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      `${own}tsconfig.json`,
      "--pretty",
      "false",
    ],
  ],
  ["scope", [`${own}scope.mjs`]],
  ["static", [`${own}static.mjs`]],
  ...[
    "scope",
    "static",
    "light",
    "measure",
    "vite.config",
    "vitest.config",
  ].map((name) => [`syntax-${name}`, ["--check", `${own}${name}.mjs`]]),
  [
    "biome",
    [
      "node_modules/@biomejs/biome/bin/biome",
      "check",
      "--assist-enabled=false",
      "packages/react/src/reordering-controller/admission.ts",
      ...(await files(own)),
      "--max-diagnostics=80",
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
    `${name} failed; raw artifacts ${fileURLToPath(output)}`,
  );
}
console.log(
  `Allowed B2 LIGHT passed: ${fileURLToPath(output)}. No runtime/historical/negative/emitted/packed suite executed.`,
);
