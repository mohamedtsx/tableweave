import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));
async function graph(entry, seen = new Set()) {
  const absolute = resolve(root, entry);
  if (seen.has(absolute)) return seen;
  seen.add(absolute);
  const source = ts.createSourceFile(
    absolute,
    await readFile(absolute, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  assert.equal(source.parseDiagnostics.length, 0, `Syntax error in ${entry}`);
  for (const node of source.statements) {
    const imported = ts.isImportDeclaration(node);
    const exported = ts.isExportDeclaration(node);
    if (
      (!imported && !exported) ||
      !node.moduleSpecifier ||
      !ts.isStringLiteral(node.moduleSpecifier)
    )
      continue;
    if (
      (imported && node.importClause?.isTypeOnly) ||
      (exported && node.isTypeOnly)
    )
      continue;
    const name = node.moduleSpecifier.text;
    assert(name.startsWith("."), `Unexpected runtime dependency: ${name}`);
    const target = resolve(dirname(absolute), name.replace(/\.js$/, ".ts"));
    await graph(relative(root, target), seen);
  }
  return seen;
}
const base = "packages/react/src/filters/";
for (const name of [
  "options-criteria-core",
  "options-source",
  "options-criteria",
]) {
  const files = [...(await graph(`${base}${name}.ts`))]
    .map((path) => relative(root, path))
    .sort();
  if (name === "options-criteria-core")
    assert.deepEqual(files, [`${base}${name}.ts`]);
  if (name === "options-source")
    assert(
      files.every(
        (path) =>
          !/\/(controller|tanstack|hooks|presentation|resource)\//.test(path),
      ),
    );
  assert(
    files.every((path) => !/\/(tanstack|hooks|presentation)\//.test(path)),
  );
  console.log(
    `${name}: static runtime import closure ${JSON.stringify(files)}`,
  );
}
console.log(
  "Static syntax/import boundary only; no runtime import or lifetime test executed.",
);
