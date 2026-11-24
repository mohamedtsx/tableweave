import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = "tests/criteria-date/";
const changed = [
  "toolbar/filter-date.tsx",
  "toolbar/criteria-tool-host.tsx",
  "date/date-types.ts",
  "date/date-operand-editor.tsx",
  "date/date-picker.tsx",
  "date/date-instant.tsx",
  "date/date-segments.tsx",
].map((path) => `packages/heroui/src/${path}`);
const added = "packages/heroui/src/date/criteria-date-state.tsx";
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
  const text = Object.fromEntries(
    await Promise.all(
      changed.map(async (path) => [
        path,
        await readFile(resolve(root, path), "utf8"),
      ]),
    ),
  );
  await writeFile(
    new URL("./source-preimages.json", import.meta.url),
    `${JSON.stringify(text, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `Captured ${Object.keys(values).length} inputs / ${Object.keys(values).filter((path) => /^packages\/(react|heroui)\/src\//.test(path)).length} sources, plus exact seven source texts. No old seal rebased.`,
  );
} else {
  const expected = JSON.parse(await readFile(before, "utf8")),
    actual = await fingerprints();
  for (const path of changed) {
    assert.equal(actual[path].mode, expected[path].mode, path);
    delete actual[path];
    delete expected[path];
  }
  assert.deepEqual(actual, expected);
  console.log(
    `${Object.keys(expected).length} protected inputs / ${Object.keys(expected).filter((path) => /^packages\/(react|heroui)\/src\//.test(path)).length} protected sources unchanged; seven allocated source modes unchanged.`,
  );
}
