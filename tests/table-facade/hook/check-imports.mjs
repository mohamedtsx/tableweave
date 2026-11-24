// Authored final-phase static graph. Not runtime, SSR or packed proof.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { own, root } from "./scope.mjs";

const ts = createRequire(join(root, "package.json"))("typescript"),
  seen = new Set(),
  external = new Set();
async function visit(path) {
  if (seen.has(path)) return;
  seen.add(path);
  assert(path.startsWith(join(root, "packages/react/src/")), path);
  const text = await readFile(path, "utf8"),
    ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  for (const statement of ast.statements) {
    if (
      !ts.isImportDeclaration(statement) &&
      !ts.isExportDeclaration(statement)
    )
      continue;
    if (statement.isTypeOnly || statement.importClause?.isTypeOnly) continue;
    if (
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      !statement.importClause.name &&
      statement.importClause.namedBindings.elements.every((e) => e.isTypeOnly)
    )
      continue;
    const specifier = statement.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier)) continue;
    const name = specifier.text;
    if (name.startsWith("."))
      await visit(resolve(dirname(path), name.replace(/\.js$/, ".ts")));
    else {
      assert(
        [
          "react",
          "@tanstack/react-table",
          "@internationalized/date",
          "@tanstack/table-core/reactivity",
          "@tanstack/table-core/store-reactivity-bindings",
        ].includes(name),
        name,
      );
      external.add(name);
    }
  }
  assert(
    !/\b(window|document|localStorage|sessionStorage)\s*[.[]/.test(text),
    path,
  );
}
await visit(join(root, "packages/react/src/table/use-data-table.ts"));
await mkdir(join(own, ".artifacts/final-imports"), { recursive: true });
await writeFile(
  join(own, ".artifacts/final-imports/graph.json"),
  JSON.stringify(
    {
      files: [...seen].sort(),
      external: [...external].sort(),
      staticOnly: true,
    },
    null,
    2,
  ),
);
