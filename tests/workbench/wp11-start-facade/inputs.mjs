import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, statfs, writeFile } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const configPath = resolve(
  root,
  "apps/example-start-facade/tsconfig.source-light.json",
);
const raw = ts.readConfigFile(configPath, ts.sys.readFile);
assert.equal(raw.error, undefined);
const config = ts.parseJsonConfigFileContent(
  raw.config,
  ts.sys,
  dirname(configPath),
);
assert.equal(config.errors.length, 0);
assert.equal(config.options.strict, true);
assert.equal(config.options.skipLibCheck, false);
assert.equal(config.options.exactOptionalPropertyTypes, true);
const program = ts.createProgram(config.fileNames, config.options);
const paths = new Set(program.getSourceFiles().map((file) => file.fileName));
for (const path of paths)
  assert(
    !/apps\/example-start\/|routeTree\.gen|src\/router\.tsx|src\/routes\/|src\/register\.d\.ts/.test(
      relative(root, path),
    ),
    `Generated-dependent/old router in SOURCE lane: ${path}`,
  );
for (const name of [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "biome.json",
  "apps/example-start-facade/package.json",
  "apps/example-start-facade/tsconfig.json",
  "apps/example-start-facade/tsconfig.source-light.json",
  "apps/example-start-facade/vite.config.ts",
  "node_modules/typescript/package.json",
  "node_modules/@biomejs/biome/package.json",
  "apps/example-start-facade/node_modules/@tanstack/react-start/src/plugin/vite.ts",
  "apps/example-start-facade/node_modules/@tanstack/router-core/src/load-client.ts",
  "apps/example-start-facade/node_modules/@tanstack/router-core/src/router.ts",
  "apps/example-start-facade/node_modules/@tanstack/query-core/src/hydration.ts",
  "apps/example-start-facade/node_modules/@tanstack/react-router-ssr-query/src/index.tsx",
])
  paths.add(resolve(root, name));
const store = await readdir(resolve(root, "node_modules/.pnpm"));
for (const [encoded, version, files] of [
  ["@tanstack+router-ssr-query-core", "1.169.3", ["src/index.ts"]],
  ["@tanstack+start-client-core", "1.170.35", ["src/client/hydrateStart.ts"]],
  ["@tanstack+start-server-core", "1.169.40", ["src/createStartHandler.ts"]],
  [
    "@tanstack+start-plugin-core",
    "1.171.50",
    [
      "src/schema.ts",
      "src/planning.ts",
      "src/vite/start-manifest-plugin/plugin.ts",
      "src/start-manifest-plugin/manifestBuilder.ts",
    ],
  ],
]) {
  const candidates = store.filter(
    (name) =>
      name === `${encoded}@${version}` ||
      name.startsWith(`${encoded}@${version}_`),
  );
  assert.equal(candidates.length, 1, `Exact existing SDK closure ${encoded}`);
  for (const file of files)
    paths.add(
      resolve(
        root,
        `node_modules/.pnpm/${candidates[0]}/node_modules/${encoded.replace("+", "/")}/${file}`,
      ),
    );
}
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
  status:
    "Actual handwritten SOURCE/noEmit program + SDK source receipts ONLY; generated routes NOT typed; no module/framework execution",
  compiler: ts.version,
  programFiles: program.getSourceFiles().length,
  records,
};
const target = process.argv[2];
assert(target?.startsWith("tests/workbench/wp11-start-facade/.artifacts/"));
if (process.argv[3] === "verify")
  assert.deepEqual(
    record,
    JSON.parse(await readFile(resolve(root, target), "utf8")),
  );
else {
  const s = await statfs(root);
  assert(s.bavail * s.bsize >= 134217728);
  await writeFile(
    resolve(root, target),
    `${JSON.stringify(record, null, 2)}\n`,
    { flag: "wx" },
  );
}
console.log(
  `TS${ts.version}: ${record.programFiles} actual source/declaration files; ${Object.keys(records).length} unique pinned program/SDK/config inputs. Generated assembly explicitly excluded.`,
);
