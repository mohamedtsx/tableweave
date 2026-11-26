import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const base = "8ba59fd";
const hash = (value) => createHash("sha256").update(value).digest("hex");
function git(args) {
  const result = spawnSync("git", args, { cwd: root });
  assert.equal(result.status, 0, result.stderr.toString());
  return result.stdout;
}
const baseline = JSON.parse(
  git(["show", `${base}:packages/react/package.json`]),
);
const actual = JSON.parse(
  await readFile(resolve(root, "packages/react/package.json"), "utf8"),
);
assert.deepEqual(actual, {
  ...baseline,
  exports: {
    ...baseline.exports,
    "./reordering-controller": {
      types: "./dist/reordering-controller/index.d.ts",
      import: "./dist/reordering-controller/index.js",
    },
  },
});

const sources = git([
  "ls-tree",
  "-r",
  "--name-only",
  base,
  "packages/react/src",
  "packages/heroui/src",
])
  .toString()
  .trim()
  .split("\n");
assert.equal(sources.length, 150);
for (const path of sources) {
  assert.equal(
    hash(await readFile(resolve(root, path))),
    hash(git(["show", `${base}:${path}`])),
    path,
  );
}
async function walk(path) {
  const entries = await readdir(resolve(root, path), { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...(await walk(child)));
    else paths.push(child);
  }
  return paths;
}
assert.deepEqual(
  [
    ...(await walk("packages/react/src")),
    ...(await walk("packages/heroui/src")),
  ].sort(),
  [...sources].sort(),
);

const indexPath = "packages/react/src/reordering-controller/index.ts";
const source = await readFile(resolve(root, indexPath), "utf8");
const index = ts.createSourceFile(
  indexPath,
  source,
  ts.ScriptTarget.Latest,
  true,
);
assert.equal(index.statements[0]?.getText(index), '"use client";');
const runtime = [];
const types = [];
for (const node of index.statements) {
  if (!ts.isExportDeclaration(node)) continue;
  assert(node.exportClause && ts.isNamedExports(node.exportClause));
  for (const item of node.exportClause.elements)
    (node.isTypeOnly || item.isTypeOnly ? types : runtime).push(item.name.text);
}
assert.deepEqual(runtime.sort(), [
  "ReorderAdmissionError",
  "captureReorderNavigation",
  "claimReorderUI",
  "createReorderController",
  "getReorderAdmissionOwner",
  "joinReorderModel",
  "observeReorderUI",
  "releaseReorderUI",
  "requireReorderAdmission",
  "requireReorderModel",
  "requireReorderNavigation",
  "suspendReorderUI",
]);
assert.deepEqual(types.sort(), [
  "ReorderAdmission",
  "ReorderAdmissionLease",
  "ReorderAdmissionOwner",
  "ReorderAdmissionSnapshot",
  "ReorderAdvanceReason",
  "ReorderApplicationMetadata",
  "ReorderControllerOptions",
  "ReorderControllerResult",
  "ReorderInteraction",
  "ReorderModelJoin",
  "ReorderNavigationOrigin",
  "ReorderUIBinding",
  "ReorderUIMetadata",
]);

async function graph(path, visited, prohibitHelper) {
  if (visited.has(path)) return;
  visited.add(path);
  if (prohibitHelper) assert(!path.includes("/reordering-controller/"), path);
  const content = await readFile(path, "utf8");
  const ast = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
  for (const statement of ast.statements) {
    if (
      !(
        ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)
      ) ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const specifier = statement.moduleSpecifier.text;
    assert(!specifier.startsWith("@dnd-kit/"), `${path}: ${specifier}`);
    if (specifier.startsWith(".")) {
      const next = resolve(dirname(path), specifier.replace(/\.js$/, ".ts"));
      try {
        await readFile(next);
        await graph(next, visited, prohibitHelper);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        await graph(next.replace(/\.ts$/, ".tsx"), visited, prohibitHelper);
      }
    }
  }
}
await graph(resolve(root, indexPath), new Set(), false);
for (const name of [
  "index",
  "contracts/index",
  "criteria/index",
  "reordering/index",
])
  await graph(resolve(root, `packages/react/src/${name}.ts`), new Set(), true);
console.log(
  "Source-only: exact additive manifest; all150 production bytes unchanged; actual12 runtime/13 type exports; no helper edge in default/contracts/criteria/pure relative source graphs. No vendor module, emitted import or installed consumer executed.",
);
