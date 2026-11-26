import assert from "node:assert/strict";
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../../", import.meta.url)),
  own = "tests/data-table/shell/",
  out = `${root}${own}.artifacts/`;
const baseline = JSON.parse(await readFile(`${out}baseline.json`, "utf8"));
const parse = (p, text) =>
  ts.createSourceFile(
    p,
    text,
    ts.ScriptTarget.Latest,
    true,
    p.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : p.endsWith(".mjs")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS,
  );
const printer = ts.createPrinter({ removeComments: true }),
  print = (node) => {
    assert.ok(node);
    return printer.printNode(
      ts.EmitHint.Unspecified,
      node,
      node.getSourceFile(),
    );
  };
function ast(node) {
  const children = [];
  ts.forEachChild(node, (child) => {
    children.push(ast(child));
  });
  return {
    kind: ts.SyntaxKind[node.kind],
    ...(ts.isIdentifier(node) || ts.isLiteralExpression(node)
      ? { text: node.text }
      : {}),
    children,
  };
}
async function file(p, old = false) {
  return parse(
    p,
    await readFile(old ? `${out}preimages/${p}` : root + p, "utf8"),
  );
}
const renderer = "packages/heroui/src/table/renderer-commit.ts",
  current = await file(renderer),
  before = await file(renderer, true);
const declaration = (source, name) =>
  source.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
for (const name of [
  "createTableRendererCell",
  "getTableRendererOwner",
  "requireTableRendererTarget",
  "tableRendererStatus",
  "subscribeTableRenderer",
])
  assert.equal(
    print(declaration(current, name)),
    print(declaration(before, name)),
    `Existing ${name} changed`,
  );
function variable(source, name) {
  for (const stmt of source.statements)
    if (ts.isVariableStatement(stmt))
      for (const decl of stmt.declarationList.declarations)
        if (decl.name.getText() === name) return decl;
  assert.fail(name);
}
for (const name of [
  "stateMessages",
  "collectionMessages",
  "selectionMessages",
  "paginationMessages",
  "sortingMessages",
  "columnMessages",
  "childMessages",
])
  assert.equal(
    print(variable(current, name)),
    print(variable(before, name)),
    `Existing message ID schema ${name} changed`,
  );
const locale = "packages/heroui/src/localization/data-table.ts",
  localeNow = await file(locale),
  localeOld = await file(locale, true);
for (const name of ["englishState", "arabicState"])
  assert.equal(
    print(variable(localeNow, name)),
    print(variable(localeOld, name)),
    `Original 14-key state container ${name} changed`,
  );
for (const name of ["englishDataTableLocale", "arabicDataTableLocale"]) {
  const now = variable(localeNow, name),
    old = variable(localeOld, name);
  assert.equal(
    now.initializer.arguments.length,
    old.initializer.arguments.length,
  );
  const arg = now.initializer.arguments[0],
    oldArg = old.initializer.arguments[0];
  assert.ok(
    ts.isSatisfiesExpression(arg) &&
      ts.isObjectLiteralExpression(arg.expression),
  );
  const props = arg.expression.properties.filter(
    (node) =>
      !ts.isPropertyAssignment(node) ||
      !["neutralMessages", "detailsRegionLabel"].includes(node.name.getText()),
  );
  const updated = ts.factory.updateObjectLiteralExpression(
    arg.expression,
    props,
  );
  assert.deepEqual(
    ast(updated),
    ast(oldArg.expression),
    `Old locale/11-port refs ${name} changed`,
  );
}
const inputs = [...baseline.existing, ...baseline.additions];
for (const entry of await readdir(root + own, { withFileTypes: true }))
  if (entry.isFile() && /\.(?:tsx?|mjs)$/.test(entry.name))
    inputs.push(own + entry.name);
for (const p of inputs) {
  const source = await file(p);
  assert.equal(source.parseDiagnostics.length, 0, `Syntax ${p}`);
  for (const stmt of source.statements)
    if (
      ts.isImportDeclaration(stmt) &&
      stmt.moduleSpecifier.text.startsWith(".")
    ) {
      const spec = stmt.moduleSpecifier.text,
        candidates = spec.endsWith(".js")
          ? [spec.replace(/\.js$/, ".ts"), spec.replace(/\.js$/, ".tsx"), spec]
          : [spec];
      let found = false;
      for (const candidate of candidates)
        try {
          await access(new URL(candidate, new URL(p, `file://${root}`)));
          found = true;
          break;
        } catch {}
      assert.ok(found, `Missing local import ${p}: ${spec}`);
    }
}
const result = {
  kind: "Static syntax/import/AST inspection only",
  inputs: inputs.length,
  originalRendererConstructorAndGuards: "AST equal",
  originalMessageSchemas: "AST equal",
  originalState14KeysAnd11PortLocaleReferences: "AST equal",
  limitations: [
    "No runtime module-cycle, React, SSR, browser, negative, golden, emitted, packed or independent verification",
    "No browser screenshot or Figma visual-match acceptance",
  ],
};
await writeFile(
  `${out}static-result.json`,
  `${JSON.stringify(result, null, 2)}\n`,
);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
