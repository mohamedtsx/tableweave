import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const sourceRoot = join(root, "packages/react/src/reordering");
const files = (await readdir(sourceRoot))
  .filter((path) => path.endsWith(".ts"))
  .sort();
assert.equal(files.length, 5);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const modules = new Map();
const identities = [];
for (const name of files) {
  const path = join(sourceRoot, name);
  const text = await readFile(path, "utf8");
  const file = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true);
  assert.equal(file.parseDiagnostics.length, 0, name);
  identities.push(`packages/react/src/reordering/${name}\0${digest(text)}\n`);
  for (const node of file.statements) {
    if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression))
      assert.notEqual(node.expression.text, "use client");
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
      continue;
    if (!node.moduleSpecifier) continue;
    const target = node.moduleSpecifier.text;
    assert(target.startsWith("./") && target.endsWith(".js"), target);
    assert(files.includes(`${target.slice(2, -3)}.ts`), target);
  }
  modules.set(name, file);
}
assert.equal(
  digest(identities.join("")),
  "f0b483b71de105c8e760be837a0adf64225420fd86f7007cec387e8ebd30569d",
);
const runtime = [];
const types = [];
for (const node of modules.get("index.ts").statements) {
  if (!ts.isExportDeclaration(node)) continue;
  assert(node.exportClause && ts.isNamedExports(node.exportClause));
  for (const item of node.exportClause.elements)
    (node.isTypeOnly || item.isTypeOnly ? types : runtime).push(item.name.text);
}
assert.deepEqual(
  runtime.sort(),
  [
    "ReorderError",
    "createRowMoveCoordinator",
    "moveVisibleColumn",
    "reorderLimits",
  ].sort(),
);
const pkg = JSON.parse(
  await readFile(join(root, "packages/react/package.json"), "utf8"),
);
assert.deepEqual(pkg.exports["./reordering"], {
  types: "./dist/reordering/index.d.ts",
  import: "./dist/reordering/index.js",
});
const output = new URL("./.artifacts/", import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(
  new URL("static.json", output),
  `${JSON.stringify({ sourceOnly: true, sourceModules: files, runtimeExports: runtime, typeExports: types, producerIdentity: digest(identities.join("")), runtimeImported: false, archiveVerified: false }, null, 2)}\n`,
);
console.log(
  "Five approved sources and explicit pure entry mapping match; no producer/runtime/archive import.",
);
