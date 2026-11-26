import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = "tests/criteria-ports/";
const added = "packages/heroui/src/filters/criteria-ports.ts";
const manifest = new URL("./protected-before.json", import.meta.url);
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
      entry.name.startsWith(".env")
    )
      continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile() && entry.name !== ".npmrc")
      files.push(relative(root, path));
  }
  return files;
}
async function fingerprints() {
  const files = [
    ...(await walk(resolve(root, "packages"))),
    ...(await walk(resolve(root, "tests"))),
    ...(await walk(resolve(root, "docs"))),
    ...(await walk(resolve(root, "product"))),
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "package.json",
    "tsconfig.base.json",
    "biome.json",
    "TASKS.md",
    "AGENTS.md",
    "PROJECT.md",
    "README.md",
  ]
    .filter((path) => !path.startsWith(own) && path !== added)
    .sort();
  return Object.fromEntries(
    await Promise.all(
      files.map(async (path) => [
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
if (process.argv[2] === "before") {
  const before = await fingerprints();
  await writeFile(manifest, `${JSON.stringify(before, null, 2)}\n`, {
    flag: "wx",
  });
  const f2 = Object.fromEntries(
    Object.entries(before).filter(
      ([path]) =>
        path.startsWith("tests/options-criteria/") ||
        /\/filters\/options-(source|criteria|criteria-core)\.ts$/.test(path),
    ),
  );
  await writeFile(
    new URL("./protected-f2-before.json", import.meta.url),
    `${JSON.stringify(f2, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `Captured ${Object.keys(before).length} frozen existing inputs, including ${Object.keys(f2).length} F2 source/fixture files. No older map rebased.`,
  );
} else {
  const before = JSON.parse(await readFile(manifest, "utf8"));
  assert.deepEqual(await fingerprints(), before);
  console.log(
    `All ${Object.keys(before).length} frozen existing inputs unchanged; only the new helper/new fixture directory excluded.`,
  );
}
