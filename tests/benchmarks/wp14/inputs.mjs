import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { root, own, files, measure, capacity } from "./scope.mjs";
export async function inputs(target, verify = false) {
  const configPath = resolve(root, `${own}tsconfig.source-light.json`),
    raw = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(raw.error, undefined);
  const config = ts.parseJsonConfigFileContent(
    raw.config,
    ts.sys,
    dirname(configPath),
  );
  assert.equal(config.errors.length, 0);
  assert.equal(ts.version, "6.0.3");
  assert.equal(config.options.noEmit, true);
  assert.equal(config.options.strict, true);
  assert.equal(config.options.skipLibCheck, false);
  assert.equal(config.options.exactOptionalPropertyTypes, true);
  const program = ts.createProgram(config.fileNames, config.options),
    paths = new Set(
      program.getSourceFiles().map((file) => relative(root, file.fileName)),
    );
  const programFiles = paths.size;
  for (const name of [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "tsconfig.base.json",
    "biome.json",
    `${own}tsconfig.source-light.json`,
    "apps/storybook/package.json",
    "node_modules/typescript/package.json",
    "node_modules/typescript/bin/tsc",
    "node_modules/typescript/lib/_tsc.js",
    "node_modules/typescript/lib/typescript.js",
    "node_modules/@biomejs/biome/package.json",
    "node_modules/@biomejs/biome/bin/biome",
  ])
    paths.add(name);
  const vendor = createRequire(
    await realpath(resolve(root, "node_modules/@biomejs/biome/package.json")),
  );
  paths.add(relative(root, vendor.resolve("@biomejs/cli-linux-x64/biome")));
  for (const path of await files(own))
    if (
      !path.startsWith(`${own}evidence/`) &&
      /\.(ts|tsx|mjs|css|html|json)$/.test(path)
    )
      paths.add(path);
  for (const name of [
    "archive",
    "receipts",
    "boundary",
    "generation",
    "installer",
    "inspect",
    "types",
  ])
    paths.add(`tests/consumers/wp13/lib/${name}.mjs`);
  paths.add("tests/consumers/wp13/matrix.json");
  paths.add(`${own}evidence/runner-input.schema.json`);
  paths.add(`${own}evidence/blocked.json`);
  const records = Object.fromEntries(
    await Promise.all(
      [...paths].sort().map(async (path) => [path, await measure(path)]),
    ),
  );
  const firstPath = resolve(root, `${own}evidence/light-001/inputs.json`);
  if (resolve(root, target) !== firstPath) {
    const first = JSON.parse(await readFile(firstPath, "utf8"));
    for (const [path, expected] of Object.entries(first.records))
      if (!path.startsWith(own))
        assert.deepEqual(
          await measure(path),
          expected,
          `First-observed tool/declaration/source drift ${path}`,
        );
  }
  const receipt = {
    status:
      "source/noEmit only, MJS inferred unchecked; no generator/statistics/config/module execution",
    compiler: ts.version,
    programFiles,
    records,
  };
  assert(target.startsWith(`${own}evidence/`));
  if (verify)
    assert.deepEqual(
      receipt,
      JSON.parse(await readFile(resolve(root, target), "utf8")),
    );
  else {
    await capacity();
    await writeFile(
      resolve(root, target),
      `${JSON.stringify(receipt, null, 2)}\n`,
      { flag: "wx" },
    );
  }
  console.log(
    `${programFiles} actual source/declaration program files; ${paths.size} pinned compiler/tool/source/declaration inputs; no runtime proof.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await inputs(process.argv[2], process.argv[3] === "verify");
