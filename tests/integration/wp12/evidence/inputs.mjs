import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import ts from "typescript";
import { capacity, measure, root } from "./scope.mjs";

await capacity();
const name = "tests/integration/wp12/tsconfig.light.json";
const configFile = ts.readConfigFile(resolve(root, name), ts.sys.readFile);
assert.equal(configFile.error, undefined);
const config = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  resolve(root, "tests/integration/wp12"),
);
assert.equal(config.errors.length, 0);
assert.equal(config.options.noEmit, true);
assert.equal(config.options.strict, true);
assert.equal(config.options.skipLibCheck, false);
assert.equal(config.options.exactOptionalPropertyTypes, true);
const program = ts.createProgram(config.fileNames, config.options);
const files = program
  .getSourceFiles()
  .map((file) => relative(root, file.fileName))
  .sort();
const inspection = [
  name,
  "package.json",
  "tsconfig.base.json",
  "biome.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "apps/storybook/package.json",
  "packages/react/package.json",
  "packages/heroui/package.json",
  "packages/heroui/compat/rac-table-clone/profile.json",
  "node_modules/typescript/package.json",
  "node_modules/typescript/lib/typescript.js",
  "node_modules/typescript/lib/tsc.js",
  "node_modules/typescript/lib/_tsc.js",
  "node_modules/@biomejs/biome/package.json",
  "node_modules/@playwright/test/package.json",
  "node_modules/@axe-core/playwright/package.json",
  "apps/storybook/node_modules/vite/package.json",
  "apps/storybook/node_modules/@vitejs/plugin-react/package.json",
  "apps/storybook/node_modules/@tailwindcss/vite/package.json",
  "apps/storybook/node_modules/@heroui/react/package.json",
  "apps/storybook/node_modules/@heroui/react/dist/components/button/button.d.ts",
  "apps/storybook/node_modules/@heroui/react/dist/components/table/table.js",
  "apps/storybook/vite.examples.config.ts",
];
const records = {};
const expectedVersions = {
  "node_modules/typescript/package.json": "6.0.3",
  "node_modules/@biomejs/biome/package.json": "2.6.8",
  "node_modules/@playwright/test/package.json": "1.65.1",
  "node_modules/@axe-core/playwright/package.json": "4.14.0",
  "apps/storybook/node_modules/vite/package.json": "7.3.8",
  "apps/storybook/node_modules/@vitejs/plugin-react/package.json": "5.2.0",
  "apps/storybook/node_modules/@tailwindcss/vite/package.json": "4.3.5",
  "apps/storybook/node_modules/@heroui/react/package.json": "3.2.8",
  "apps/storybook/node_modules/@heroui/styles/package.json": "3.2.8",
  "apps/storybook/node_modules/react/package.json": "19.3.1",
  "apps/storybook/node_modules/react-dom/package.json": "19.3.1",
  "apps/storybook/node_modules/react-aria-components/package.json": "1.22.1",
};
for (const [path, expected] of Object.entries(expectedVersions)) {
  assert.equal(
    JSON.parse(await readFile(resolve(root, path), "utf8")).version,
    expected,
    path,
  );
  inspection.push(path);
}
inspection.push(
  "apps/storybook/node_modules/react-aria-components/dist/private/Table.mjs",
);
for (const path of [...new Set([...files, ...inspection])].sort())
  records[path] = await measure(path);
const record = {
  compiler: ts.version,
  node: process.versions.node,
  expectedVersions,
  boundary:
    "strict positive SOURCE only; configuration/app/vendor/test module bodies NOT executed",
  files,
  inspection,
  records,
};
const target = process.argv[2];
assert(
  target?.startsWith("tests/integration/wp12/evidence/.artifacts/") &&
    !target.includes(".."),
);
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
  `TS${ts.version}: ${files.length} actual program files; ${Object.keys(records).length} unique pinned byte/mode inputs.`,
);
