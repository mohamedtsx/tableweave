import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../..");
export const hash = (value) => createHash("sha256").update(value).digest("hex");
const artifacts = join(own, ".artifacts");
const producer = "packages/heroui/src/filters/criteria-commit.tsx";
const additions = [
  "packages/heroui/src/filters/criteria-commit-core.ts",
  "packages/heroui/src/table/types.ts",
  "packages/heroui/src/table/renderer-commit.ts",
];
const baselineHash =
  "0def42f9748a3762d2a4399d3930a8b0afd7b1ff68a86d0ee3473a3b5437e656";
const producerHash =
  "a135a5d1ef6c773bc21fc2233338a695818db8767018b797d0e3f0d9337fb3ff";
async function files(directory, skip = []) {
  const result = [];
  for (const entry of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    if (skip.includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (resolve(root, path) === own) continue;
    if (entry.isDirectory()) result.push(...(await files(path, skip)));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}
async function sources() {
  const map = {};
  for (const path of [
    ...(await files("packages/react/src")),
    ...(await files("packages/heroui/src")),
  ].sort())
    map[path] = {
      mode: (await stat(join(root, path))).mode & 0o111 ? "100755" : "100644",
      sha256: hash(await readFile(join(root, path))),
    };
  return map;
}
async function inputs() {
  const paths = [
    ...(await files("tests", ["node_modules", "dist"])),
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "biome.json",
    "tsconfig.base.json",
    "vitest.config.ts",
    "playwright.config.ts",
    ...["react", "heroui"].flatMap((pkg) =>
      ["package.json", "tsconfig.json", "tsconfig.build.json"].map(
        (file) => `packages/${pkg}/${file}`,
      ),
    ),
  ].sort();
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [path, hash(await readFile(join(root, path)))]),
    ),
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(artifacts, { recursive: true });
  if (process.argv[2] === "--before") {
    const bytes = await readFile(
      "/tmp/opencode/wp09-before-renderer-commit-source122.json",
    );
    assert.equal(hash(bytes), baselineHash);
    const map = JSON.parse(bytes);
    assert.equal(Object.keys(map).length, 122);
    assert.equal(map[producer].sha256, producerHash);
    assert.deepEqual(await sources(), map);
    await writeFile(join(artifacts, "before-source122.json"), bytes, {
      flag: "wx",
    });
    await writeFile(
      join(artifacts, "protected-source121.json"),
      `${JSON.stringify(Object.fromEntries(Object.entries(map).filter(([path]) => path !== producer)), null, 2)}\n`,
      { flag: "wx" },
    );
    await writeFile(
      join(artifacts, "original-criteria-commit.tsx"),
      await readFile(join(root, producer)),
      { flag: "wx" },
    );
    const old = await inputs();
    await writeFile(
      join(artifacts, "before-inputs.json"),
      `${JSON.stringify(old, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      JSON.stringify(
        {
          sourceFiles: 122,
          protectedSources: 121,
          originalInputs: Object.keys(old).length,
          aggregate: baselineHash,
          producerHash,
        },
        null,
        2,
      ),
    );
  } else if (process.argv[2] === "--after") {
    const bytes = await readFile(join(artifacts, "before-source122.json"));
    assert.equal(hash(bytes), baselineHash);
    const baseline = JSON.parse(bytes),
      protectedMap = JSON.parse(
        await readFile(join(artifacts, "protected-source121.json"), "utf8"),
      ),
      current = await sources();
    assert.deepEqual(
      protectedMap,
      Object.fromEntries(
        Object.entries(baseline).filter(([path]) => path !== producer),
      ),
    );
    for (const [path, value] of Object.entries(protectedMap))
      assert.deepEqual(current[path], value, path);
    assert.deepEqual(
      Object.keys(current).sort(),
      [...Object.keys(baseline), ...additions].sort(),
    );
    assert.equal(
      hash(await readFile(join(artifacts, "original-criteria-commit.tsx"))),
      producerHash,
    );
    const before = JSON.parse(
      await readFile(join(artifacts, "before-inputs.json"), "utf8"),
    );
    assert.deepEqual(await inputs(), before);
    const paths = [
      producer,
      ...additions,
      "tests/table-renderer-commit/.artifacts/original-criteria-commit.tsx",
      "tests/table-renderer-commit/.artifacts/criteria-ports.ts",
      ...(await readdir(own, { withFileTypes: true }))
        .filter((e) => e.isFile())
        .map((e) => `tests/table-renderer-commit/${e.name}`),
    ].sort();
    const map = Object.fromEntries(
      await Promise.all(
        paths.map(async (path) => [
          path,
          hash(await readFile(join(root, path))),
        ]),
      ),
    );
    const result = {
      status: "PROVISIONAL implementation only; final verification deferred",
      inputs: map,
      aggregate: hash(`${JSON.stringify(map, null, 2)}\n`),
      protectedSources: 121,
      protectedOldInputsAndArtifacts: Object.keys(before).length,
      unchanged: true,
      outputIdentityRegistered: false,
    };
    await writeFile(
      join(artifacts, "handoff.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ...result, inputs: paths.length }, null, 2));
  } else throw new Error("Use --before/--after");
}
