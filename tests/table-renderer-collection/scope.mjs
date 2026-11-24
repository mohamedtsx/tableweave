import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../..");
const artifacts = join(own, ".artifacts");
const canonical = "/tmp/opencode/wp09-after-s1-d1-source126.json";
const expected =
  "4a956137a365746d964c084a161884853650138c36e1aebe6a586d178345b731";
const allocated = [
  "packages/heroui/src/table/types.ts",
  "packages/heroui/src/table/renderer-commit.ts",
  "packages/heroui/src/table/native-collection.tsx",
  "packages/heroui/src/selection/types.ts",
  "packages/heroui/src/selection/selection-toolbar.tsx",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function files(directory, skip = []) {
  const paths = [];
  for (const entry of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    if (skip.includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (resolve(root, path) === own) continue;
    if (entry.isDirectory()) paths.push(...(await files(path, skip)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}
async function sources() {
  const paths = [
    ...(await files("packages/react/src")),
    ...(await files("packages/heroui/src")),
  ].sort();
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [
        path,
        {
          mode:
            (await stat(join(root, path))).mode & 0o111 ? "100755" : "100644",
          sha256: hash(await readFile(join(root, path))),
        },
      ]),
    ),
  );
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
async function vendorTrace() {
  const paths = [
    "packages/react/node_modules/@tanstack/react-table/dist/FlexRender.js",
    "packages/react/node_modules/@tanstack/react-table/dist/useTable.js",
    "packages/react/node_modules/@tanstack/react-table/package.json",
  ];
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [path, hash(await readFile(join(root, path)))]),
    ),
  );
}

await mkdir(artifacts, { recursive: true });
if (process.argv[2] === "--before") {
  const bytes = await readFile(canonical);
  assert.equal(hash(bytes), expected);
  const baseline = JSON.parse(bytes);
  assert.equal(Object.keys(baseline).length, 126);
  assert.deepEqual(await sources(), baseline);
  const protectedSources = Object.fromEntries(
    Object.entries(baseline).filter(([path]) => !allocated.includes(path)),
  );
  assert.equal(Object.keys(protectedSources).length, 121);
  await writeFile(join(artifacts, "before-source126.json"), bytes, {
    flag: "wx",
  });
  await writeFile(
    join(artifacts, "protected-source121.json"),
    `${JSON.stringify(protectedSources, null, 2)}\n`,
    { flag: "wx" },
  );
  for (const path of allocated) {
    const destination = join(artifacts, "preimages", path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, await readFile(join(root, path)), {
      flag: "wx",
    });
  }
  const old = await inputs();
  await writeFile(
    join(artifacts, "before-inputs.json"),
    `${JSON.stringify(old, null, 2)}\n`,
    { flag: "wx" },
  );
  await writeFile(
    join(artifacts, "vendor-trace.json"),
    `${JSON.stringify(await vendorTrace(), null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    JSON.stringify(
      {
        sourceFiles: 126,
        protectedSources: 121,
        existingInputs: Object.keys(old).length,
        baseline: expected,
      },
      null,
      2,
    ),
  );
} else if (process.argv[2] === "--stopped") {
  const bytes = await readFile(join(artifacts, "before-source126.json"));
  assert.equal(hash(bytes), expected);
  const baseline = JSON.parse(bytes);
  assert.deepEqual(await sources(), baseline);
  assert.deepEqual(
    JSON.parse(
      await readFile(join(artifacts, "protected-source121.json"), "utf8"),
    ),
    Object.fromEntries(
      Object.entries(baseline).filter(([path]) => !allocated.includes(path)),
    ),
  );
  for (const path of allocated)
    assert.equal(
      hash(await readFile(join(artifacts, "preimages", path))),
      baseline[path].sha256,
      path,
    );
  const beforeInputs = JSON.parse(
    await readFile(join(artifacts, "before-inputs.json"), "utf8"),
  );
  assert.deepEqual(await inputs(), beforeInputs);
  assert.deepEqual(
    await vendorTrace(),
    JSON.parse(await readFile(join(artifacts, "vendor-trace.json"), "utf8")),
  );
  const paths = (await files("tests/table-renderer-collection"))
    .filter((path) => !path.includes("/.artifacts/"))
    .sort();
  const inputMap = Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [path, hash(await readFile(join(root, path)))]),
    ),
  );
  const result = {
    status:
      "STOPPED before producer edits: actual React/native render-entry seam requires main disposition",
    inputs: inputMap,
    aggregate: hash(`${JSON.stringify(inputMap, null, 2)}\n`),
    canonicalSource126: expected,
    allocatedSourceEdits: 0,
    protectedOtherSources: 121,
    all126SourcesUnchanged: true,
    existingInputsUnchanged: Object.keys(beforeInputs).length,
    vendorTraceUnchanged: true,
    runtimeCasesExecuted: 0,
    implementationReady: false,
    outputIdentityRegistered: false,
  };
  await writeFile(
    join(artifacts, "handoff.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(JSON.stringify({ ...result, inputs: paths.length }, null, 2));
} else
  throw new Error(
    "Use --before or --stopped (no implementation baseline rebasing)",
  );
