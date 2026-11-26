import assert from "node:assert/strict";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { root, own, changed, files, measure, capacity } from "./scope.mjs";
export async function inputs(target, verify = false) {
  const original = JSON.parse(
    await readFile(
      resolve(root, "tests/benchmarks/wp14/evidence/light-008/inputs.json"),
      "utf8",
    ),
  );
  const path = resolve(root, `${own}tsconfig.source-light.json`),
    raw = ts.readConfigFile(path, ts.sys.readFile);
  assert.equal(raw.error, undefined);
  const config = ts.parseJsonConfigFileContent(
    raw.config,
    ts.sys,
    dirname(path),
  );
  assert.equal(config.errors.length, 0);
  for (const key of [
    "strict",
    "noEmit",
    "exactOptionalPropertyTypes",
    "noUncheckedIndexedAccess",
    "noUnusedLocals",
    "noUnusedParameters",
  ])
    assert.equal(config.options[key], true);
  assert.equal(config.options.skipLibCheck, false);
  assert.equal(ts.version, "6.0.3");
  const program = ts.createProgram(config.fileNames, config.options),
    paths = new Set([
      ...Object.keys(original.records),
      ...program.getSourceFiles().map((file) => relative(root, file.fileName)),
    ]);
  for (const name of await files(own))
    if (!name.startsWith(`${own}evidence/`)) paths.add(name);
  for (const name of [
    "profile.json",
    "runtime.patch",
    "verify.mjs",
    "README.md",
    "NOTICE-RAC",
    "LICENSE-APACHE-2.0",
  ])
    paths.add(`packages/heroui/compat/rac-table-clone/${name}`);
  paths.add("tests/consumers/wp13/profiles/rac-runtime.json");
  for (const name of [
    "package.json",
    "dist/private/Table.js",
    "dist/private/Table.mjs",
    "dist/private/Table.cjs",
  ])
    paths.add(`apps/storybook/node_modules/react-aria-components/${name}`);
  const vendor = createRequire(
    await realpath(resolve(root, "node_modules/@biomejs/biome/package.json")),
  );
  paths.add(relative(root, vendor.resolve("@biomejs/cli-linux-x64/biome")));
  const records = Object.fromEntries(
    await Promise.all(
      [...paths].sort().map(async (name) => [name, await measure(name)]),
    ),
  );
  for (const [name, expected] of Object.entries(original.records)) {
    if (changed.includes(name)) assert.notDeepEqual(records[name], expected);
    else
      assert.deepEqual(
        records[name],
        expected,
        `Original1335 pin drift ${name}`,
      );
  }
  const value = {
    status:
      "SOURCE/noEmit only; helper MJS unchecked; no profile/helper/unit/native/cleanup/runtime execution",
    compiler: ts.version,
    originalPins: 1335,
    expectedBodyDrift: changed,
    programFiles: program.getSourceFiles().length,
    records,
  };
  assert(target.startsWith(`${own}evidence/`));
  if (verify)
    assert.deepEqual(
      value,
      JSON.parse(await readFile(resolve(root, target), "utf8")),
    );
  else {
    await capacity();
    await writeFile(
      resolve(root, target),
      `${JSON.stringify(value, null, 2)}\n`,
      { flag: "wx" },
    );
  }
  console.log(
    `${value.programFiles} actual program files; ${paths.size} pinned tool/SDK/profile/runtime/source inputs; original1335 ONLY two disclosed body drifts.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await inputs(process.argv[2], process.argv[3] === "verify");
