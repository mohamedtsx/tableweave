import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const entry = await read("packages/heroui/src/index.ts");
const source = ts.createSourceFile(
  "index.ts",
  entry,
  ts.ScriptTarget.Latest,
  true,
);
assert.equal(source.parseDiagnostics.length, 0);
assert.equal(source.statements[0].expression.text, "use client");
const exported = [];
for (const node of source.statements) {
  if (!ts.isExportDeclaration(node) || !node.exportClause) continue;
  assert(ts.isNamedExports(node.exportClause));
  for (const item of node.exportClause.elements)
    exported.push({
      name: item.name.text,
      original: item.propertyName?.text ?? item.name.text,
      module: node.moduleSpecifier.text,
      type: node.isTypeOnly || item.isTypeOnly,
    });
}
for (const name of [
  "DataTable",
  "RecordDetails",
  "useDetailsAccessory",
  "TableDetailsTrigger",
  "englishDataTableLocale",
  "arabicDataTableLocale",
  "englishDataTableNeutralMessages",
  "arabicDataTableNeutralMessages",
])
  assert.equal(
    exported.filter((item) => item.name === name && !item.type).length,
    1,
  );
assert(
  exported.some(
    (item) =>
      item.name === "DetailsTrigger" && item.module === "./details/index.js",
  ),
);
for (const name of [
  "createTableRendererCell",
  "TableRendererActor",
  "TableRendererLease",
  "DetailsCommitActor",
  "DetailsBinding",
  "createCriteriaFacadeSource",
])
  assert(!exported.some((item) => item.name === name));
const tableTypes = exported
  .filter((item) => item.module === "./table/types.js")
  .map((item) => item.name)
  .sort();
assert.deepEqual(
  tableTypes,
  [
    "DataTableCollectionConfig",
    "DataTableLocale",
    "DataTableMessages",
    "DataTableNeutralMessages",
    "DataTableProps",
    "DataTableStateContext",
    "DataTableStateMessages",
    "DataTableToolConfigs",
    "DataTableToolbarContext",
  ].sort(),
);
const styles = await read("packages/heroui/src/styles.css");
assert.equal(
  styles.match(/@import "\.\/data-table\/styles\.css";/g)?.length,
  1,
);
assert.match(
  await read("packages/heroui/src/data-table/styles.css"),
  /@layer tableweave/,
);
const copier = ts.createSourceFile(
  "copy-styles.mjs",
  await read("tests/foundation/copy-styles.mjs"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
assert.equal(copier.parseDiagnostics.length, 0);
const declaration = copier.statements
  .filter(ts.isVariableStatement)
  .flatMap((node) => [...node.declarationList.declarations])
  .find(
    (node) => ts.isIdentifier(node.name) && node.name.text === "componentRoots",
  );
assert(declaration && ts.isArrayLiteralExpression(declaration.initializer));
assert.deepEqual(
  declaration.initializer.elements.map((item) => item.text),
  [
    "filters",
    "toolbar",
    "date",
    "columns",
    "pagination",
    "details",
    "data-table",
  ],
);
const output = new URL("./.artifacts/", import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(
  new URL("static.json", output),
  `${JSON.stringify({ sourceOnly: true, exports: exported, tableTypes, cssImportAndOwnedRoot: true, runtimeOrArchiveExecuted: false }, null, 2)}\n`,
);
console.log(
  "Explicit source exports, legacy trigger and CSS owned-root mapping pass; no producer/runtime/archive import.",
);
