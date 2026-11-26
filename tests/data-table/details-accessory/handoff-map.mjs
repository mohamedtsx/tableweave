import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url)),
  own = "tests/data-table/details-accessory/",
  here = root + own;
const sha = (input) => createHash("sha256").update(input).digest("hex");
const encode = (value) => JSON.stringify(value, null, 2) + "\n";
const baseline = JSON.parse(await readFile(here + "baseline.json", "utf8"));
async function paths(dir) {
  const result = [];
  for (const entry of await readdir(root + dir, { withFileTypes: true })) {
    const path = dir + entry.name;
    if (entry.isDirectory()) result.push(...(await paths(path + "/")));
    else if (entry.isFile()) result.push(path);
    else throw new Error(`Unexpected non-file ${path}`);
  }
  return result;
}
async function map(files) {
  const result = {};
  for (const path of [...new Set(files)].sort())
    result[path] = {
      mode: (await stat(root + path)).mode.toString(8),
      sha256: sha(await readFile(root + path)),
    };
  return result;
}
await mkdir(here + ".artifacts", { recursive: true });
if (process.argv[2] === "compile") {
  const source = [
    ...(await paths("packages/react/src/")),
    ...(await paths("packages/heroui/src/")),
  ].filter((path) => /\.tsx?$/.test(path));
  const fixtures = (await paths(own)).filter(
    (path) =>
      !path.includes("/preimages/") &&
      !path.includes("/.artifacts/") &&
      /\.tsx?$/.test(path) &&
      !path.endsWith("types.negative.ts"),
  );
  const inputs = await map([
    ...source,
    ...fixtures,
    "tsconfig.base.json",
    own + "tsconfig.light.json",
    "tests/table-facade/hook/owner.ts",
  ]);
  await writeFile(here + ".artifacts/compile-inputs.json", encode(inputs), {
    flag: "wx",
  });
  process.stdout.write(
    encode({
      inputs: Object.keys(inputs).length,
      sha256: sha(encode(inputs)),
      scope:
        "TS6 positive/noEmit source inputs only; no compile executed by this script",
    }),
  );
} else {
  const compile = JSON.parse(
    await readFile(here + ".artifacts/compile-inputs.json", "utf8"),
  );
  assert.deepEqual(
    await map(Object.keys(compile)),
    compile,
    "Positive compiler inputs changed after capture",
  );
  const files = [
    ...baseline.existing,
    ...baseline.additions,
    ...(await paths(own)).filter(
      (path) => path !== own + ".artifacts/implementation-map.json",
    ),
  ];
  const inputs = await map(files),
    result = { base: baseline.base, files: inputs };
  await writeFile(here + ".artifacts/implementation-map.json", encode(result));
  process.stdout.write(
    encode({
      files: Object.keys(inputs).length,
      sha256: sha(encode(result)),
      compileInputsStable: true,
    }),
  );
}
