import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import { hash, own, preimage, producer, root } from "./scope.mjs";

const beforeText = await readFile(preimage, "utf8"),
  afterText = await readFile(join(root, producer), "utf8");
assert.equal(
  hash(beforeText),
  "aa8d59d31482fa8958039e827dc17f39e3aa361a6922b162e7c4b56be40d32a5",
);
const parse = (text) =>
  ts.createSourceFile(
    "provider.tsx",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
const before = parse(beforeText),
  after = parse(afterText),
  printer = ts.createPrinter({ removeComments: true });
const print = (node, source) =>
  printer.printNode(ts.EmitHint.Unspecified, node, source);
const name = (node) =>
  ts.isVariableStatement(node)
    ? node.declarationList.declarations[0]?.name.getText()
    : node.name?.text;
const added = [
  "englishDetailsRegionLabel",
  "arabicDetailsRegionLabel",
  "RecordDetailsProps",
  "invalidNeutralMetadata",
  "recordDetailsOwnData",
  "captureNeutralLabel",
];
const record = (source) =>
  source.statements.find(
    (node) =>
      ts.isFunctionDeclaration(node) && node.name.text === "RecordDetails",
  );
const a = record(after),
  b = record(before);
assert(a && b);
assert.deepEqual(
  a.typeParameters.map((node) => print(node, after)),
  b.typeParameters.map((node) => print(node, before)),
);
assert.equal(a.parameters.length, 1);
assert.equal(a.parameters[0].name.getText(after), "props");
assert.equal(a.parameters[0].type.getText(after), "RecordDetailsProps<S, T>");
const expected =
  parse(`const accessory = recordDetailsOwnData(props, "accessory") as DetailsAccessory<S, T>;
const binding = getDetailsBinding(accessory);
const neutralLabel = captureNeutralLabel(props);
const session = useBoundDetailsSession(accessory);`);
assert.deepEqual(
  a.body.statements.slice(0, 4).map((node) => print(node, after)),
  expected.statements.map((node) => print(node, expected)),
);
let labelChanges = 0;
const transform = (context) => (node) => {
  const visit = (child) => {
    if (
      ts.isJsxAttribute(child) &&
      child.name.getText(after) === "aria-label" &&
      child.initializer &&
      ts.isJsxExpression(child.initializer) &&
      child.initializer.expression?.getText(after) === "neutralLabel"
    ) {
      labelChanges++;
      return ts.factory.updateJsxAttribute(
        child,
        child.name,
        ts.factory.createStringLiteral("Record details region"),
      );
    }
    return ts.visitEachChild(child, visit, context);
  };
  return ts.visitNode(node, visit);
};
const result = ts.transform(a.body, [transform]);
const body = result.transformed[0];
assert.equal(labelChanges, 1);
assert.deepEqual(
  body.statements.slice(4).map((node) => print(node, after)),
  b.body.statements.slice(1).map((node) => print(node, before)),
  "All hooks/effects/focus/body/ref/anatomy after the metadata prefix must be identical",
);
result.dispose();
const unrelated = (source) =>
  source.statements
    .filter(
      (node) => name(node) !== "RecordDetails" && !added.includes(name(node)),
    )
    .map((node) => print(node, source));
assert.deepEqual(
  unrelated(after),
  unrelated(before),
  "Imports, provider, accessory/context hooks must be unchanged",
);
for (const [id, value] of [
  ["englishDetailsRegionLabel", "Record details region"],
  ["arabicDetailsRegionLabel", "منطقة تفاصيل السجل"],
]) {
  const declaration = after.statements.find((node) => name(node) === id)
    ?.declarationList?.declarations[0];
  assert(declaration && ts.isStringLiteral(declaration.initializer));
  assert.equal(declaration.initializer.text, value);
}
const imports = after.statements
  .filter(ts.isImportDeclaration)
  .map((node) => node.moduleSpecifier.text);
const report = {
  status: "PASS static AST only, no provider/React/SSR module execution",
  exactPreimage: true,
  normalizedLabelAttributes: labelChanges,
  recordDetailsHookEffectFocusBodyTailIdentical: true,
  allUnrelatedDeclarationsAndImportsIdentical: true,
  newMetadataDeclarations: added,
  imports,
  runtimeExecuted: false,
};
await mkdir(join(own, ".artifacts"), { recursive: true });
await writeFile(
  join(own, ".artifacts/static-result.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
