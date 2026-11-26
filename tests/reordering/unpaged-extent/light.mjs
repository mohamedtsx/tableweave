import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/reordering/unpaged-extent/";
const label = process.argv[2];
assert(label && /^[\w-]+$/.test(label), "Supply a fresh light run label");
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const output = new URL(`./.artifacts/${label}/`, import.meta.url);
await mkdir(output);
async function codeFiles(path) {
  const result = [];
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
    if (entry.isDirectory()) result.push(...(await codeFiles(`${name}/`)));
    else if (/\.(?:ts|tsx|mjs|json)$/.test(name)) result.push(name);
  }
  return result;
}
const sources = [
  "packages/react/src/reordering/types.ts",
  "packages/react/src/reordering/capture.ts",
  "packages/react/src/reordering-controller/admission.ts",
];
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
  [
    "positive-pure",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      `${own}tsconfig.pure.json`,
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
      ...sources,
      ...(await codeFiles(own)),
      "--max-diagnostics=60",
    ],
  ],
];
const records = [];
for (const [name, args] of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
  await writeFile(
    new URL(`${name}.log`, output),
    `${result.stdout ?? ""}${result.stderr ?? ""}`,
  );
  records.push({ name, args, status: result.status });
  await writeFile(
    new URL("results.json", output),
    `${JSON.stringify(records, null, 2)}\n`,
  );
  assert.equal(
    result.status,
    0,
    `${name} failed; raw logs ${fileURLToPath(output)}`,
  );
}
console.log(
  `Allowed U1 light checks passed: ${fileURLToPath(output)}. No old hardcoded-producer scope/runtime check was executed.`,
);
