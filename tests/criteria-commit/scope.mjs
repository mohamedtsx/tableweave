import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = "tests/criteria-commit/";
const added = "packages/heroui/src/filters/criteria-commit.tsx";
async function walk(directory) {
  const files = [];
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
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(relative(root, path));
  }
  return files;
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
const manifest = new URL("./protected-before.json", import.meta.url);
if (process.argv[2] === "before") {
  const values = await fingerprints();
  await writeFile(manifest, `${JSON.stringify(values, null, 2)}\n`, {
    flag: "wx",
  });
  const sources = Object.fromEntries(
    Object.entries(values).filter(([path]) =>
      /^packages\/(react|heroui)\/src\//.test(path),
    ),
  );
  await writeFile(
    new URL("./protected-sources-before.json", import.meta.url),
    `${JSON.stringify(sources, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `Captured ${Object.keys(values).length} existing inputs and ${Object.keys(sources).length} existing source fingerprints. No historical map rebased.`,
  );
} else {
  const before = JSON.parse(await readFile(manifest, "utf8"));
  assert.deepEqual(await fingerprints(), before);
  console.log(
    `All ${Object.keys(before).length} existing inputs unchanged; only the new cell module/new fixture folder excluded.`,
  );
}
