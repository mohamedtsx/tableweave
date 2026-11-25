import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, statfs, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url)),
  own = "tests/workbench/wp11-start-facade/";
const label = process.argv[2];
assert(label && /^[\w-]+$/.test(label));
async function space() {
  const s = await statfs(root);
  assert(
    s.bavail * s.bsize >= 134217728,
    "Below 128MiB free-space floor; no cleanup authorized",
  );
}
await space();
await mkdir(`${root}/${own}.artifacts/`, { recursive: true });
const directory = `${own}.artifacts/${label}/`;
await mkdir(`${root}/${directory}`);
async function files(path) {
  const result = [];
  for (const entry of await readdir(`${root}/${path}`, {
    withFileTypes: true,
  })) {
    if (
      [
        "node_modules",
        ".artifacts",
        "before.json",
        "handoff-hashes.json",
        "preimages",
      ].includes(entry.name)
    )
      continue;
    const name = `${path}${entry.name}`;
    if (entry.isDirectory()) result.push(...(await files(`${name}/`)));
    else if (
      /\.(ts|tsx|mjs|json)$/.test(name) &&
      name !== "apps/example-start-facade/package.json"
    )
      result.push(name);
  }
  return result;
}
const supported = [
  ...(await files("apps/example-start-facade/")),
  ...(await files(own)),
];
const commands = [
  ["inputs-before", [`${own}inputs.mjs`, `${directory}inputs.json`]],
  [
    "positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "apps/example-start-facade/tsconfig.source-light.json",
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
  await space();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 300000,
  });
  await space();
  await writeFile(
    `${root}/${directory}${name}.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`,
    { flag: "wx" },
  );
  results.push({ name, args, status: result.status, signal: result.signal });
  await writeFile(
    `${root}/${directory}results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
  assert.equal(
    result.status,
    0,
    `${name}: preserved raw failure at ${directory}${name}.log`,
  );
}
console.log(
  `SOURCE LIGHT passed ${directory}; ${supported.length} supported files; whole generated assembly/framework/module/runtime/SSR/browser/negative/dual/packed UNRUN.`,
);
