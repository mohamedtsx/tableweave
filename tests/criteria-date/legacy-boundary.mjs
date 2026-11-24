import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const before = JSON.parse(
  await readFile(new URL("./source-preimages.json", import.meta.url), "utf8"),
);
const printer = ts.createPrinter({ removeComments: true });
const parse = (name, text) =>
  ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
const renamed = {
  FilterDate: "LegacyFilterDate",
  DateOperandEditor: "LegacyDateOperandEditor",
  DayPointPicker: "LegacyDayPointPicker",
  DayRangePicker: "LegacyDayRangePicker",
  InstantPointEditor: "LegacyInstantPointEditor",
  DateSegmentsObserver: "LegacyDateSegmentsObserver",
};
let bodies = 0;
for (const [path, text] of Object.entries(before)) {
  if (!path.endsWith("tsx") || path.endsWith("criteria-tool-host.tsx"))
    continue;
  const old = parse(path, text),
    now = parse(
      path,
      await readFile(new URL(`../../${path}`, import.meta.url), "utf8"),
    );
  for (const fn of old.statements.filter(ts.isFunctionDeclaration)) {
    if (!fn.body || !fn.name) continue;
    const actual = now.statements.find(
      (node) =>
        ts.isFunctionDeclaration(node) &&
        node.name?.text === (renamed[fn.name.text] ?? fn.name.text),
    );
    assert(actual?.body, `${path}: ${fn.name.text}`);
    const body = (node, file) =>
      printer.printNode(ts.EmitHint.Unspecified, node, file);
    assert.equal(
      body(actual.body, now),
      body(fn.body, old),
      `${path}: raw ${fn.name.text} body unchanged`,
    );
    bodies++;
  }
}
// Compare the whole host AST after removing precisely the Date-only additions.
const host = "packages/heroui/src/toolbar/criteria-tool-host.tsx";
const old = parse(host, before[host]),
  now = parse(
    host,
    await readFile(new URL(`../../${host}`, import.meta.url), "utf8"),
  );
const withoutDate = ts.transform(now, [
  (context) => (root) => {
    const visit = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        node.moduleSpecifier.text === "../date/criteria-date-state.js"
      )
        return undefined;
      if (ts.isTypeAliasDeclaration(node) && node.name.text === "ToolbarKind")
        return ts.factory.updateTypeAliasDeclaration(
          node,
          node.modifiers,
          node.name,
          node.typeParameters,
          ts.factory.createUnionTypeNode(
            ["search", "tabs"].map((value) =>
              ts.factory.createLiteralTypeNode(
                ts.factory.createStringLiteral(value),
              ),
            ),
          ),
        );
      if (
        ts.isIfStatement(node) &&
        node.expression.getText(now) === 'kind === "date"'
      )
        return undefined;
      if (
        ts.isConditionalExpression(node) &&
        node.condition.getText(now) === 'kind === "date"'
      )
        return ts.visitNode(node.whenFalse, visit);
      return ts.visitEachChild(node, visit, context);
    };
    return ts.visitNode(root, visit);
  },
]);
const actual = printer.printFile(withoutDate.transformed[0]),
  expected = printer.printFile(old);
const tokens = (text) => {
  const scanner = ts.createScanner(
      ts.ScriptTarget.Latest,
      true,
      ts.LanguageVariant.JSX,
      text,
    ),
    result = [];
  for (
    let kind = scanner.scan();
    kind !== ts.SyntaxKind.EndOfFileToken;
    kind = scanner.scan()
  )
    result.push([kind, scanner.getTokenText()]);
  return result;
};
assert.deepEqual(
  tokens(actual),
  tokens(expected),
  "Original host AST printer tokens after removing only Date branches/type/import",
);
withoutDate.dispose();
console.log(
  `${bodies} original function bodies unchanged; original non-Date host AST unchanged.`,
);
