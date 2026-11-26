import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, realpath, stat, statfs, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/workbench/wp11-start-retirement/",
  parent = "apps/example-start-facade/src/application/bootstrap-session.ts";
const historical = JSON.parse(
  await readFile(
    resolve(
      root,
      "tests/workbench/wp11-start-facade/.artifacts/light-004/inputs.json",
    ),
    "utf8",
  ),
);
assert.equal(Object.keys(historical.records).length, 769);
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
for (const option of [
  "strict",
  "exactOptionalPropertyTypes",
  "noUncheckedIndexedAccess",
  "noUnusedLocals",
  "noUnusedParameters",
  "noEmit",
])
  assert.equal(config.options[option], true, option);
assert.equal(config.options.skipLibCheck, false);
const program = ts.createProgram(config.fileNames, config.options);
const programPaths = program
  .getSourceFiles()
  .map((file) => relative(root, file.fileName));
for (const path of programPaths)
  assert(
    !/apps\/example-start\/|routeTree\.gen|src\/router\.tsx|src\/routes\/|src\/register\.d\.ts/.test(
      path,
    ),
    path,
  );
assert(
  programPaths.includes(
    "tests/workbench/wp11-start-facade/final/contracts.test.ts",
  ),
);
const paths = new Set([
  ...Object.keys(historical.records),
  ...programPaths,
  `${own}tsconfig.source-light.json`,
  "node_modules/typescript/bin/tsc",
  "node_modules/typescript/lib/_tsc.js",
  "node_modules/typescript/lib/typescript.js",
  "node_modules/@biomejs/biome/bin/biome",
  "apps/example-start-facade/node_modules/@tanstack/query-core/src/queryClient.ts",
  "apps/example-start-facade/node_modules/@tanstack/query-core/src/queryCache.ts",
  "apps/example-start-facade/node_modules/@tanstack/query-core/src/query.ts",
  "apps/example-start-facade/node_modules/@tanstack/query-core/src/retryer.ts",
]);
const vendor = createRequire(
  await realpath(resolve(root, "node_modules/@biomejs/biome/package.json")),
);
paths.add(relative(root, vendor.resolve("@biomejs/cli-linux-x64/biome")));
const records = Object.fromEntries(
  await Promise.all(
    [...paths].sort().map(async (path) => [
      path,
      {
        sha256: createHash("sha256")
          .update(await readFile(resolve(root, path)))
          .digest("hex"),
        mode: (await stat(resolve(root, path))).mode & 0o777,
      },
    ]),
  ),
);
for (const [path, expected] of Object.entries(historical.records)) {
  if (path === parent) assert.notDeepEqual(records[path], expected);
  else
    assert.deepEqual(
      records[path],
      expected,
      `Historical SDK/program/config bytes changed: ${path}`,
    );
}
const record = {
  compiler: ts.version,
  status:
    "SOURCE noEmit only, including declared FINAL UNRUN test bodies; no module/framework execution or generated assembly",
  historicalInputs: 769,
  historicalParentBodyDrift: parent,
  programFiles: programPaths.length,
  records,
};
const target = process.argv[2];
assert(target?.startsWith(`${own}.artifacts/`));
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
  `TS${ts.version}: ${programPaths.length} program files/${paths.size} pinned program/tool/SDK inputs. Original769 have ONLY parent body drift; generated-dependent assembly excluded. FINAL tests not executed.`,
);
