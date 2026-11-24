import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const own = dirname(fileURLToPath(import.meta.url));
const root = resolve(own, "../..");
const artifacts = join(own, ".artifacts");
const canonical = "/tmp/opencode/wp09-after-s2-date-locales-source129.json";
const aggregate =
  "52a14c39ca28b51004a2316bf200ab9bd64b5fca2a19522ccd31a92f47f0885b";
const allocated = [
  "packages/heroui/src/filters/criteria-commit.tsx",
  "packages/heroui/src/toolbar/criteria-tool-host.tsx",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
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
await mkdir(artifacts, { recursive: true });
if (process.argv[2] === "--before") {
  const bytes = await readFile(canonical);
  assert.equal(hash(bytes), aggregate);
  const baseline = JSON.parse(bytes);
  assert.equal(Object.keys(baseline).length, 129);
  assert.deepEqual(await sources(), baseline);
  const protected127 = Object.fromEntries(
    Object.entries(baseline).filter(([path]) => !allocated.includes(path)),
  );
  assert.equal(Object.keys(protected127).length, 127);
  await writeFile(join(artifacts, "before-source129.json"), bytes, {
    flag: "wx",
  });
  await writeFile(
    join(artifacts, "protected-source127.json"),
    `${JSON.stringify(protected127, null, 2)}\n`,
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
  console.log(
    JSON.stringify(
      {
        sourceFiles: 129,
        protectedSources: 127,
        canonical: aggregate,
        initialProducerHashes: Object.fromEntries(
          allocated.map((path) => [path, baseline[path].sha256]),
        ),
        existingInputs: Object.keys(old).length,
      },
      null,
      2,
    ),
  );
} else if (process.argv[2] === "--stopped") {
  const bytes = await readFile(join(artifacts, "before-source129.json"));
  assert.equal(hash(bytes), aggregate);
  const baseline = JSON.parse(bytes);
  assert.deepEqual(await sources(), baseline);
  assert.deepEqual(
    JSON.parse(
      await readFile(join(artifacts, "protected-source127.json"), "utf8"),
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
  const paths = (await readdir(own, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => `tests/criteria-facade-config/${entry.name}`)
    .sort();
  const inputMap = Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [path, hash(await readFile(join(root, path)))]),
    ),
  );
  const result = {
    status:
      "STOPPED before producer edits: superseded child capture needs a closed non-destructive core abort seam",
    inputs: inputMap,
    aggregate: hash(`${JSON.stringify(inputMap, null, 2)}\n`),
    baselineSource129: aggregate,
    protectedSources: 127,
    all129SourcesUnchanged: true,
    existingInputsUnchanged: Object.keys(beforeInputs).length,
    producerEdits: 0,
    runtimeExecuted: false,
    implementationReady: false,
    outputIdentityRegistered: false,
  };
  await writeFile(
    join(artifacts, "handoff.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(JSON.stringify({ ...result, inputs: paths.length }, null, 2));
} else
  throw new Error("Use --before/--stopped; original maps remain historical");
