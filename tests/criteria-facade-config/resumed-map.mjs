import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url)),
  own = "tests/criteria-facade-config/",
  out = `${root}${own}.artifacts/resumed/`;
const json = (value) => `${JSON.stringify(value, null, 2)}\n`,
  sha = (value) => createHash("sha256").update(value).digest("hex");
const baseline = JSON.parse(await readFile(`${out}baseline.json`, "utf8"));
async function walk(dir) {
  const paths = [];
  for (const entry of await readdir(root + dir, { withFileTypes: true })) {
    const path = dir + entry.name;
    if (entry.isDirectory()) paths.push(...(await walk(`${path}/`)));
    else if (entry.isFile()) paths.push(path);
    else throw new Error(`Unexpected entry ${path}`);
  }
  return paths;
}
async function map(paths) {
  const result = {};
  for (const path of [...new Set(paths)].sort())
    result[path] = {
      mode: (await stat(root + path)).mode.toString(8),
      sha256: sha(await readFile(root + path)),
    };
  return result;
}
if (process.argv[2] === "compile") {
  const source = [
    ...(await walk("packages/heroui/src/")),
    ...(await walk("packages/react/src/")),
  ].filter((path) => /\.tsx?$/.test(path));
  const tests = (await readdir(root + own))
    .filter((path) => /\.tsx?$/.test(path) && path !== "negative-types.tsx")
    .map((path) => own + path);
  const input = await map([
    ...source,
    ...tests,
    "tsconfig.base.json",
    own + "tsconfig.light.json",
    "tests/criteria-commit/tsconfig.json",
    "tests/table-facade/hook/owner.ts",
  ]);
  await writeFile(`${out}compile-inputs-2.json`, json(input), { flag: "wx" });
  process.stdout.write(
    json({ inputs: Object.keys(input).length, sha256: sha(json(input)) }),
  );
} else {
  const compile = JSON.parse(
    await readFile(`${out}compile-inputs-2.json`, "utf8"),
  );
  assert.deepEqual(
    await map(Object.keys(compile)),
    compile,
    "Positive compiler input drift",
  );
  const owned = [
    ...baseline.existing,
    baseline.addition,
    own + "README.md",
    ...(await walk(own)).filter(
      (path) => path !== `${own}.artifacts/resumed/implementation-map.json`,
    ),
  ];
  // Include the immutable stopped evidence too; it stays historical, not rebased.
  const files = await map(owned),
    value = { base: baseline.base, files };
  await writeFile(`${out}implementation-map.json`, json(value));
  process.stdout.write(
    json({
      files: Object.keys(files).length,
      sha256: sha(json(value)),
      compileInputsStable: true,
    }),
  );
}
