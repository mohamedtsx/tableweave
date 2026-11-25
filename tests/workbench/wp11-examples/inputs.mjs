import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const configs = [
  "apps/storybook/tsconfig.examples-light.json",
  "apps/example-start/tsconfig.wp11-light.json",
];
const paths = new Set(),
  programs = [];
for (const name of configs) {
  const path = resolve(root, name),
    raw = ts.readConfigFile(path, ts.sys.readFile);
  assert.equal(raw.error, undefined);
  const config = ts.parseJsonConfigFileContent(
    raw.config,
    ts.sys,
    resolve(path, ".."),
  );
  assert.equal(config.errors.length, 0);
  const program = ts.createProgram(config.fileNames, config.options),
    files = program.getSourceFiles().map((file) => file.fileName);
  for (const file of files) paths.add(file);
  paths.add(path);
  programs.push({
    config: name,
    files: files.map((file) => relative(root, file)).sort(),
    strict: config.options.strict,
    exactOptionalPropertyTypes: config.options.exactOptionalPropertyTypes,
    skipLibCheck: config.options.skipLibCheck,
  });
}
for (const name of [
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "biome.json",
  "apps/storybook/package.json",
  "apps/example-start/package.json",
  "packages/react/package.json",
  "packages/heroui/package.json",
  "apps/storybook/vite.examples.config.ts",
  "node_modules/typescript/package.json",
  "node_modules/@biomejs/biome/package.json",
  "apps/storybook/node_modules/vite/package.json",
  "apps/storybook/node_modules/@vitejs/plugin-react/package.json",
  "apps/storybook/node_modules/@tailwindcss/vite/package.json",
  "apps/storybook/node_modules/@heroui/react/package.json",
  "apps/example-start/node_modules/@tanstack/query-core/package.json",
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
const record = {
  evidence:
    "Actual TS positive programs and pinned manifests; app/vendor module bodies NOT executed",
  compiler: ts.version,
  programs,
  records,
};
const target = process.argv[2];
assert(target?.startsWith("tests/workbench/wp11-examples/.artifacts/"));
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
  `TS${ts.version}: ${programs.map((program) => `${program.config}:${program.files.length}`).join(", ")}; ${Object.keys(records).length} pinned unique byte/mode inputs.`,
);
