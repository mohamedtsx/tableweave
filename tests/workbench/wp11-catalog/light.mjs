import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/workbench/wp11-catalog/";
const label = process.argv[2];
assert(label && /^[\w-]+$/.test(label));
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const directory = `${own}.artifacts/${label}/`;
await mkdir(new URL(directory, new URL("../../../", import.meta.url)));
async function files(path) {
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
    if (entry.isDirectory()) result.push(...(await files(`${name}/`)));
    else if (/\.(ts|tsx|mjs|json|css)$/.test(name)) result.push(name);
  }
  return result;
}
const supported = [
  ...(await files("apps/examples/shared/")),
  ...(await files("apps/storybook/src/workbench/")),
  ...(await files(own)),
  "apps/storybook/src/styles.css",
];
const commands = [
  ["inputs-before", [`${own}inputs.mjs`, `${directory}inputs.json`]],
  [
    "positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "apps/storybook/src/workbench/tsconfig.light.json",
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
  ["inputs-after", [`${own}inputs.mjs`, `${directory}inputs.json`, "verify"]],
];
const results = [];
for (const [name, args] of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
  await writeFile(
    `${root}/${directory}${name}.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}`,
    { flag: "wx" },
  );
  results.push({ name, args, status: result.status });
  await writeFile(
    `${root}/${directory}results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
  assert.equal(
    result.status,
    0,
    `${name} failed; retained ${directory}${name}.log`,
  );
}
console.log(
  `LIGHT only passed at ${directory}; ${supported.length} supported files. No app/vendor runtime, story plays, browser/server/build/SSR/negative/packed/dual/unit/CI/independent check ran.`,
);
