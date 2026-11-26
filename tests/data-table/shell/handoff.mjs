import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../../", import.meta.url)),
  own = "tests/data-table/shell/",
  out = `${root}${own}.artifacts/`;
const json = (value) => `${JSON.stringify(value, null, 2)}\n`,
  sha = (value) => createHash("sha256").update(value).digest("hex");
async function walk(dir) {
  const result = [];
  for (const e of await readdir(root + dir, { withFileTypes: true })) {
    const p = dir + e.name;
    if (e.isDirectory()) result.push(...(await walk(`${p}/`)));
    else {
      assert.ok(e.isFile(), p);
      result.push(p);
    }
  }
  return result;
}
async function map(paths) {
  const result = {};
  for (const p of [...new Set(paths)].sort())
    result[p] = {
      mode: (await lstat(root + p)).mode.toString(8),
      sha256: sha(await readFile(root + p)),
    };
  return result;
}
if (process.argv[2] === "pin") {
  const path = root + own + "tsconfig.light.json",
    config = ts.getParsedCommandLineOfConfigFile(
      path,
      { noEmit: true },
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: () =>
          assert.fail("Invalid positive config"),
      },
    );
  assert.ok(config);
  const program = ts.createProgram(config.fileNames, config.options);
  const paths = program
    .getSourceFiles()
    .map((f) => f.fileName)
    .filter((p) => p.startsWith(root) && !p.includes("/node_modules/"))
    .map((p) => p.slice(root.length));
  assert.ok(!paths.some((p) => p.includes("negative-types")));
  const files = await map([
    ...paths,
    "tsconfig.base.json",
    own + "tsconfig.light.json",
    "tests/data-table/details-accessory/tsconfig.light.json",
  ]);
  const value = { compiler: ts.version, files };
  await writeFile(`${out}positive-inputs-2.json`, json(value), { flag: "wx" });
  process.stdout.write(
    json({
      inputs: Object.keys(files).length,
      compiler: ts.version,
      sha256: sha(json(value)),
    }),
  );
} else {
  const compile = JSON.parse(
    await readFile(`${out}positive-inputs-2.json`, "utf8"),
  );
  assert.deepEqual(
    await map(Object.keys(compile.files)),
    compile.files,
    "Positive compiler input changed",
  );
  const baseline = JSON.parse(await readFile(`${out}baseline.json`, "utf8")),
    paths = (await walk(own)).filter(
      (p) => p !== own + ".artifacts/implementation-map.json",
    );
  const files = await map([
      ...baseline.existing,
      ...baseline.additions,
      ...paths,
    ]),
    value = { base: baseline.base, files };
  await writeFile(`${out}implementation-map.json`, json(value));
  process.stdout.write(
    json({
      files: Object.keys(files).length,
      sha256: sha(json(value)),
      positiveInputsStable: true,
    }),
  );
}
