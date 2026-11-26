import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/workbench/wp11-examples/",
  label = process.argv[2];
assert(label && /^[\w-]+$/.test(label));
await mkdir(`${root}/${own}.artifacts/`, { recursive: true });
const output = `${own}.artifacts/${label}/`;
await mkdir(`${root}/${output}`);
async function files(directory) {
  const result = [];
  for (const entry of await readdir(`${root}/${directory}`, {
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
    const path = `${directory}${entry.name}`;
    if (entry.isDirectory()) result.push(...(await files(`${path}/`)));
    else if (/\.(ts|tsx|json|mjs|css)$/.test(path)) result.push(path);
  }
  return result;
}
const supported = [
  ...(await files("apps/examples/vite/")),
  ...(await files("apps/examples/recipes/")),
  ...(await files("apps/example-start/src/recipes/wp11/")),
  ...(await files(own)),
  "apps/storybook/vite.examples.config.ts",
  "apps/storybook/tsconfig.examples-light.json",
  "apps/example-start/tsconfig.wp11-light.json",
];
const commands = [
  ["inputs-before", [`${own}inputs.mjs`, `${output}inputs.json`]],
  [
    "vite-positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "apps/storybook/tsconfig.examples-light.json",
      "--pretty",
      "false",
    ],
  ],
  [
    "start-positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "apps/example-start/tsconfig.wp11-light.json",
      "--pretty",
      "false",
    ],
  ],
  ["scope", [`${own}scope.mjs`]],
  ["static", [`${own}static.mjs`]],
  ...supported
    .filter((path) => path.endsWith(".mjs"))
    .map((path) => [`syntax-${path.split("/").at(-1)}`, ["--check", path]]),
  [
    "biome",
    [
      "node_modules/@biomejs/biome/bin/biome",
      "check",
      "--assist-enabled=false",
      ...supported,
      "--max-diagnostics=100",
    ],
  ],
  ["inputs-after", [`${own}inputs.mjs`, `${output}inputs.json`, "verify"]],
];
const results = [];
for (const [name, args] of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
  await writeFile(
    `${root}/${output}${name}.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}`,
    { flag: "wx" },
  );
  results.push({ name, args, status: result.status });
  await writeFile(
    `${root}/${output}results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
  assert.equal(
    result.status,
    0,
    `${name} failed; raw log ${output}${name}.log retained`,
  );
}
console.log(
  `LIGHT PASS ${output}; ${supported.length} supported files; no module/app/test/build/server/browser/SSR/negative/emitted/ordinary/packed runtime executed.`,
);
