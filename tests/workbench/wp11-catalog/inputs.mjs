import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const configPath = resolve(
  root,
  "apps/storybook/src/workbench/tsconfig.light.json",
);
const raw = ts.readConfigFile(configPath, ts.sys.readFile);
assert.equal(raw.error, undefined);
const config = ts.parseJsonConfigFileContent(
  raw.config,
  ts.sys,
  resolve(configPath, ".."),
);
assert.equal(config.errors.length, 0);
const program = ts.createProgram(config.fileNames, config.options);
const paths = new Set(program.getSourceFiles().map((file) => file.fileName));
for (const name of [
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "biome.json",
  "apps/storybook/package.json",
  "apps/storybook/src/workbench/tsconfig.light.json",
  "node_modules/typescript/package.json",
  "node_modules/@biomejs/biome/package.json",
  "apps/storybook/node_modules/storybook/package.json",
  "apps/storybook/node_modules/storybook/dist/test/index.d.ts",
  "apps/storybook/node_modules/@heroui/react/package.json",
  "apps/storybook/node_modules/vite/package.json",
  "apps/storybook/node_modules/react-aria-components/dist/private/Table.mjs",
])
  paths.add(resolve(root, name));
const records = Object.fromEntries(
  await Promise.all(
    [...paths].sort().map(async (path) => [
      relative(root, path),
      {
        sha256: createHash("sha256")
          .update(await readFile(path))
          .digest("hex"),
        mode: (await stat(path)).mode & 0o777,
      },
    ]),
  ),
);
const target = process.argv[2];
assert(target?.startsWith("tests/workbench/wp11-catalog/.artifacts/"));
const record = {
  compiler: ts.version,
  evidence:
    "Actual positive program and pinned inspection inputs only; no modules imported/executed from the app or vendor runtime",
  records,
};
if (process.argv[3] === "verify")
  assert.deepEqual(
    record,
    JSON.parse(await readFile(resolve(root, target), "utf8")),
  );
else
  await writeFile(
    resolve(root, target),
    `${JSON.stringify(record, null, 2)}\n`,
    { flag: "wx" },
  );
console.log(
  `Pinned TS${ts.version} positive-program/inspection inputs: ${Object.keys(records).length}.`,
);
