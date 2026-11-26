import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const path = fileURLToPath(
  new URL(
    "../../packages/heroui/src/filters/criteria-ports.ts",
    import.meta.url,
  ),
);
const text = await readFile(path, "utf8");
const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
assert.equal(source.parseDiagnostics.length, 0);
let typeImports = 0;
for (const node of source.statements) {
  if (!ts.isImportDeclaration(node)) continue;
  assert.equal(
    node.importClause?.isTypeOnly,
    true,
    "Only erased actual-type imports are allowed",
  );
  typeImports++;
}
const output = ts.transpileModule(text, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
  reportDiagnostics: true,
});
assert.equal(output.diagnostics.length, 0);
const emitted = ts.createSourceFile(
  "owned-helper.js",
  output.outputText,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
assert(
  !emitted.statements.some(
    (node) =>
      ts.isImportDeclaration(node) ||
      (ts.isExportDeclaration(node) && node.moduleSpecifier),
  ),
);
console.log(
  `Static helper runtime graph: one module, zero runtime imports; ${typeImports} erased imports of actual source types.`,
);
console.log(
  "Parser/transpile inspection only: no helper callbacks, source runtime import, React or actor test executed.",
);
