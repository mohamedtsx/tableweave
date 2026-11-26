import { readFile } from "node:fs/promises";
import ts from "typescript";
import { expect, test } from "vitest";

function subtree(text: string, tag: string) {
  const source = ts.createSourceFile(
    "producer.tsx",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let found: ts.JsxElement | ts.JsxSelfClosingElement | undefined;
  function find(node: ts.Node) {
    if (
      (ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(source) === tag) ||
      (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === tag)
    ) {
      found ??= node;
      return;
    }
    ts.forEachChild(node, find);
  }
  find(source);
  if (!found) throw new Error(`Missing actual ${tag}`);
  const transform: ts.TransformerFactory<ts.Node> = (context) => (node) => {
    const visitor: ts.Visitor = (child) => {
      // Select only the EXPLICIT raw branches; do not normalize other behavior.
      if (
        ts.isConditionalExpression(child) &&
        child.condition.getText(source) === "target"
      )
        return ts.visitNode(child.whenFalse, visitor);
      if (
        ts.isBinaryExpression(child) &&
        child.operatorToken.kind === ts.SyntaxKind.BarBarToken &&
        child.left.getText(source) === "!eligible()"
      )
        return ts.visitNode(child.right, visitor);
      return ts.visitEachChild(child, visitor, context);
    };
    return ts.visitNode(node, visitor) ?? node;
  };
  const result = ts.transform<ts.Node>(found, [transform]);
  const transformed = result.transformed[0];
  if (!transformed) throw new Error("Missing transformed JSX");
  const printed = ts
    .createPrinter({ removeComments: true })
    .printNode(ts.EmitHint.Unspecified, transformed, source);
  result.dispose();
  return printed;
}
for (const [path, tag] of [
  ["table/native-collection.tsx", "ControlledCollection"],
  ["selection/selection-toolbar.tsx", "fieldset"],
] as const)
  test(`raw ${path} original compound JSX/handlers remain, excluding only explicit renderer denial`, async () => {
    const before = await readFile(
      new URL(
        `./.artifacts/preimages/packages/heroui/src/${path}`,
        import.meta.url,
      ),
      "utf8",
    );
    const after = await readFile(
      new URL(`../../packages/heroui/src/${path}`, import.meta.url),
      "utf8",
    );
    expect(subtree(after, tag)).toBe(subtree(before, tag));
  });

for (const [path, name] of [
  ["table/native-collection.tsx", "NativeSelectionCount"],
  ["selection/selection-toolbar.tsx", "FocusRegion"],
] as const)
  test(`original ${name} producer body remains byte-independent AST golden`, async () => {
    const before = await readFile(
      new URL(
        `./.artifacts/preimages/packages/heroui/src/${path}`,
        import.meta.url,
      ),
      "utf8",
    );
    const after = await readFile(
      new URL(`../../packages/heroui/src/${path}`, import.meta.url),
      "utf8",
    );
    function declaration(text: string) {
      const source = ts.createSourceFile(
        "producer.tsx",
        text,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      let found: ts.Node | null = null;
      function visit(node: ts.Node) {
        if (
          (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) &&
          node.name?.getText(source) === name
        )
          found = node;
        else ts.forEachChild(node, visit);
      }
      visit(source);
      if (!found) throw new Error(`Missing ${name}`);
      return ts
        .createPrinter({ removeComments: true })
        .printNode(ts.EmitHint.Unspecified, found, source);
    }
    expect(declaration(after)).toBe(declaration(before));
  });
