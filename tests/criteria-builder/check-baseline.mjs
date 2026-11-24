import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Read-only source-scope evidence. Never regenerates the canonical main map or
// any historical Date/F3 seal, and never loads an application/runtime module.
const root = new URL("../../", import.meta.url);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const bytes = await readFile(
  "/tmp/opencode/wp09-before-builder-source127.json",
);
assert.equal(
  sha256(bytes),
  "8281387f44e3ef1e0392159d329e05c7a5e0d319311f42b673beaa923ceee1e2",
  "Exact main-supplied map bytes",
);
const map = JSON.parse(bytes);
const allocated = new Set(
  [
    "types.ts",
    "filter-builder.tsx",
    "option-owners.tsx",
    "value-editors.tsx",
  ].map((name) => `packages/heroui/src/filters/${name}`),
);
assert.equal(Object.keys(map).length, 127);
for (const [path, expected] of Object.entries(map)) {
  const actual = await stat(new URL(path, root));
  assert(actual.isFile(), path);
  assert.equal(
    sha256(await readFile(new URL(path, root))),
    expected.sha256,
    path,
  );
  // Main's map records Git-style executable/non-executable modes, not all
  // filesystem permission bits. Group-write permission is not a Git-mode delta.
  assert.equal(actual.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
async function walk(url) {
  const names = [];
  for (const child of await readdir(url, { withFileTypes: true })) {
    const path = new URL(`${child.name}${child.isDirectory() ? "/" : ""}`, url);
    if (child.isDirectory()) names.push(...(await walk(path)));
    else if (child.isFile())
      names.push(fileURLToPath(path).slice(fileURLToPath(root).length));
  }
  return names;
}
const actualPaths = [
  ...(await walk(new URL("packages/react/src/", root))),
  ...(await walk(new URL("packages/heroui/src/", root))),
].sort();
assert.deepEqual(
  actualPaths,
  Object.keys(map).sort(),
  "No source additions/removals",
);
console.log(
  JSON.stringify({
    mode: "read-only main source-map check",
    mapSha256: sha256(bytes),
    unchangedSourcesIncludingCss: actualPaths.length,
    protectedOutsideLease: actualPaths.filter((path) => !allocated.has(path))
      .length,
    allocatedSourcesAlsoUnchanged: allocated.size,
    sourceAdditions: 0,
    sourceRemovals: 0,
    gitStyleModesMatch: true,
    applicationModulesLoaded: 0,
    emittedFilesWritten: 0,
  }),
);
