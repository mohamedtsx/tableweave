// Final-phase static source graph only; NOT runtime/cycle/SSR/privacy proof.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { own, root } from "./scope.mjs";

const ts = createRequire(join(root, "package.json"))("typescript"),
  visited = new Set(),
  edges = [],
  external = new Set();
async function visit(path) {
  if (visited.has(path)) return;
  visited.add(path);
  const text = await readFile(path, "utf8"),
    source = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
  assert(
    !/\b(window|document|localStorage|sessionStorage)\s*[.[]/.test(text),
    path,
  );
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
      continue;
    if (node.isTypeOnly || node.importClause?.isTypeOnly) continue;
    if (
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings) &&
      !node.importClause.name &&
      node.importClause.namedBindings.elements.every((e) => e.isTypeOnly)
    )
      continue;
    const specifier = node.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier)) continue;
    const value = specifier.text;
    if (value.startsWith(".")) {
      let target = resolve(dirname(path), value.replace(/\.js$/, ".ts"));
      try {
        await readFile(target);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        target += "x";
      }
      edges.push([path, target]);
      await visit(target);
    } else {
      assert(
        [
          "@tableweave/react",
          "@tableweave/react/contracts",
          "@tableweave/react/filters",
        ].includes(value),
        value,
      );
      external.add(value);
    }
  }
}
await visit(join(root, "packages/heroui/src/table/renderer-commit.ts"));
await mkdir(join(own, ".artifacts/final-boundary"), { recursive: true });
await writeFile(
  join(own, ".artifacts/final-boundary/graph.json"),
  JSON.stringify(
    {
      files: [...visited].sort(),
      edges,
      external: [...external].sort(),
      functionOnlyPolicyCyclesRequireRuntimeVerification: true,
      staticOnly: true,
    },
    null,
    2,
  ),
);
