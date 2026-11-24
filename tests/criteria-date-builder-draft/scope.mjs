import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const source = "packages/heroui/src/date/criteria-date-state.tsx";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const original = await readFile(
  "/tmp/opencode/wp09-before-builder-source127.json",
);
assert.equal(
  digest(original),
  "8281387f44e3ef1e0392159d329e05c7a5e0d319311f42b673beaa923ceee1e2",
);
const originalMap = JSON.parse(original);
assert.equal(Object.keys(originalMap).length, 127);
assert.equal(
  originalMap[source].sha256,
  "c504fa002f2f0d61fb1932f9511a3e66fa82b8a7073f1ad937048566fcab814c",
);
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
        "test-results",
        "playwright-report",
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
async function inputs() {
  const paths = [
    ...(await walk(resolve(root, "packages"))),
    ...(await walk(resolve(root, "tests"))),
    ...(await walk(resolve(root, "docs"))),
    ...(await walk(resolve(root, "product"))),
    ...(await walk(resolve(root, ".agents"))),
    "AGENTS.md",
    "PROJECT.md",
    "README.md",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "tsconfig.base.json",
    "biome.json",
  ]
    .filter(
      (path) =>
        path !== source &&
        !path.startsWith("tests/criteria-date-builder-draft/"),
    )
    .sort();
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [
        path,
        {
          sha256: digest(await readFile(resolve(root, path))),
          mode: (await stat(resolve(root, path))).mode & 0o777,
        },
      ]),
    ),
  );
}
const before = new URL("./before.json", import.meta.url);
if (process.argv[2] === "before") {
  for (const [path, expected] of Object.entries(originalMap))
    assert.equal(
      digest(await readFile(resolve(root, path))),
      expected.sha256,
      path,
    );
  await writeFile(
    before,
    `${JSON.stringify({ originalSourceMapSha256: digest(original), excluded: [source, "TASKS.md (main-owned bookkeeping)", "tests/criteria-date-builder-draft/**"], files: await inputs() }, null, 2)}\n`,
    { flag: "wx" },
  );
  await writeFile(
    new URL("./source-preimage.txt", import.meta.url),
    await readFile(resolve(root, source)),
    { flag: "wx" },
  );
  console.log(
    "Captured new-stage protected inputs after TASKS update; original source127/Date/Builder seals were not recaptured.",
  );
} else {
  const expected = JSON.parse(await readFile(before, "utf8"));
  assert.deepEqual(await inputs(), expected.files);
  for (const [path, value] of Object.entries(originalMap)) {
    const mode = (await stat(resolve(root, path))).mode;
    assert.equal(mode & 0o111 ? "100755" : "100644", value.mode, path);
    if (path !== source)
      assert.equal(
        digest(await readFile(resolve(root, path))),
        value.sha256,
        path,
      );
  }
  await assert.rejects(
    stat(
      resolve(root, "packages/heroui/src/filters/criteria-builder-host.tsx"),
    ),
    { code: "ENOENT" },
  );
  console.log(
    `${Object.keys(expected.files).length} protected inputs unchanged; 126 protected sources derived from original map unchanged; four Builder hashes/modes preserved; Builder host absent.`,
  );
}
