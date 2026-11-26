import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = "tests/criteria-search-tabs/";
export const changed = [
  "filter-shared.ts",
  "filter-search.tsx",
  "filter-tabs.tsx",
].map((name) => `packages/heroui/src/toolbar/${name}`);
const added = "packages/heroui/src/toolbar/criteria-tool-host.tsx";
async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      [
        "node_modules",
        ".git",
        ".repo",
        ".artifacts",
        "dist",
        "build",
        "playwright-report",
        "test-results",
      ].includes(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name === ".npmrc"
    )
      continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (entry.isFile()) paths.push(relative(root, path));
  }
  return paths;
}
async function fingerprints() {
  const paths = [
    ...(await walk(resolve(root, "packages"))),
    ...(await walk(resolve(root, "tests"))),
    ...(await walk(resolve(root, "docs"))),
    ...(await walk(resolve(root, "product"))),
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "tsconfig.base.json",
    "biome.json",
    "TASKS.md",
    "PROJECT.md",
    "AGENTS.md",
    "README.md",
  ]
    .filter((path) => !path.startsWith(own) && path !== added)
    .sort();
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [
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
}
const before = new URL("./before.json", import.meta.url);
if (process.argv[2] === "before") {
  const values = await fingerprints();
  await writeFile(before, `${JSON.stringify(values, null, 2)}\n`, {
    flag: "wx",
  });
  const sources = Object.keys(values).filter((path) =>
    /^packages\/(react|heroui)\/src\//.test(path),
  );
  console.log(
    `Captured ${Object.keys(values).length} input preimages and ${sources.length} existing sources; three deltas separately allowed, no historical seal rebased.`,
  );
} else {
  const expected = JSON.parse(await readFile(before, "utf8")),
    actual = await fingerprints();
  for (const path of changed) {
    assert.equal(
      actual[path].mode,
      expected[path].mode,
      `Allocated source mode changed: ${path}`,
    );
    delete expected[path];
    delete actual[path];
  }
  assert.deepEqual(actual, expected);
  console.log(
    `${Object.keys(expected).length} protected existing inputs unchanged; only three allocated existing toolbar files/new host/own fixtures excluded.`,
  );
}
