import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = "tests/options-criteria/";
const changed = "packages/react/src/filters/options-source.ts";
const additions = new Set([
  "packages/react/src/filters/options-criteria.ts",
  "packages/react/src/filters/options-criteria-core.ts",
]);
const manifest = new URL("./protected-before.json", import.meta.url);
const beforeSource = new URL("./options-source.before.txt", import.meta.url);
async function walk(directory) {
  const result = [];
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
      ].includes(entry.name)
    )
      continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else if (entry.isFile()) result.push(relative(root, path));
  }
  return result;
}
async function fingerprints() {
  const paths = [
    ...(await walk(resolve(root, "packages"))),
    ...(await walk(resolve(root, "tests"))),
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "package.json",
    "tsconfig.base.json",
    "biome.json",
  ]
    .filter((path) => !path.startsWith(own) && !additions.has(path))
    .sort();
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => {
        const absolute = resolve(root, path);
        return [
          path,
          {
            sha256: createHash("sha256")
              .update(await readFile(absolute))
              .digest("hex"),
            mode: (await stat(absolute)).mode & 0o777,
          },
        ];
      }),
    ),
  );
}
if (process.argv[2] === "split") {
  // Derive only from the immutable BEFORE capture, never current producer bytes.
  const values = JSON.parse(await readFile(manifest, "utf8"));
  const sources = Object.fromEntries(
    Object.entries(values).filter(
      ([path]) =>
        path !== changed && /^packages\/(react|heroui)\/src\//.test(path),
    ),
  );
  const inputs = Object.fromEntries(
    Object.entries(values).filter(
      ([path]) => path !== changed && !Object.hasOwn(sources, path),
    ),
  );
  await writeFile(
    new URL("./protected-sources-before.json", import.meta.url),
    `${JSON.stringify(sources, null, 2)}\n`,
    { flag: "wx" },
  );
  await writeFile(
    new URL("./protected-inputs-before.json", import.meta.url),
    `${JSON.stringify(inputs, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `Separated original ${Object.keys(sources).length} other-source and ${Object.keys(inputs).length} existing-input fingerprints; no recapture.`,
  );
} else if (process.argv[2] === "before") {
  try {
    await stat(manifest);
    throw new Error("Refuse to replace historical before map");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const values = await fingerprints();
  await writeFile(manifest, `${JSON.stringify(values, null, 2)}\n`, {
    flag: "wx",
  });
  await writeFile(beforeSource, await readFile(resolve(root, changed)), {
    flag: "wx",
  });
  console.log(
    `Captured ${Object.keys(values).length} protected/allocated inputs; original source preserved separately.`,
  );
} else {
  const before = JSON.parse(await readFile(manifest, "utf8"));
  const after = await fingerprints();
  assert.deepEqual(Object.keys(after), Object.keys(before));
  let protectedSources = 0;
  for (const [path, value] of Object.entries(before)) {
    if (path === changed) continue;
    assert.deepEqual(after[path], value, `Protected input changed: ${path}`);
    if (/^packages\/(react|heroui)\/src\//.test(path)) protectedSources++;
  }
  console.log(
    `Scope intact: ${protectedSources} other sources; ${Object.keys(before).length - 1} protected inputs. No historical maps rebased.`,
  );
}
