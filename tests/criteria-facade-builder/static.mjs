import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const path = "packages/heroui/src/filters/criteria-builder-host.tsx";
function parse(name, text) {
  const file = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  assert.equal(file.parseDiagnostics.length, 0, name);
  return file;
}
const original = parse(
  path,
  await readFile(new URL("./source-preimage.txt", import.meta.url), "utf8"),
);
const current = parse(path, await readFile(new URL(path, root), "utf8"));
const printer = ts.createPrinter({ removeComments: true });
const printed = (node, file) =>
  printer.printNode(ts.EmitHint.Unspecified, node, file);
let unchanged = 0;
for (const node of original.statements) {
  if (!ts.isFunctionDeclaration(node) || !node.name) continue;
  if (node.name.text === "createCriteriaBuilderStore") continue;
  const next = current.statements.find(
    (item) =>
      ts.isFunctionDeclaration(item) && item.name?.text === node.name.text,
  );
  assert(next, node.name.text);
  assert.equal(printed(next, current), printed(node, original), node.name.text);
  unchanged++;
}
function storeObject(file) {
  let found;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(file) === "store" &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    )
      found = node.initializer.arguments[0];
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert(found && ts.isObjectLiteralExpression(found));
  return found;
}
const oldStore = storeObject(original),
  newStore = storeObject(current);
const keys = (node, file) =>
  node.properties.map((item) => item.name.getText(file));
assert.deepEqual(keys(newStore, current), keys(oldStore, original));
for (const item of oldStore.properties) {
  const name = item.name.getText(original);
  if (["mount", "commit"].includes(name)) continue;
  const next = newStore.properties.find(
    (value) => value.name.getText(current) === name,
  );
  assert.equal(printed(next, current), printed(item, original), name);
}
function calls(file, name) {
  const found = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ((ts.isIdentifier(node.expression) && node.expression.text === name) ||
        (ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === name))
    )
      found.push(printed(node, file));
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}
assert.deepEqual(calls(current, "createLocal"), calls(original, "createLocal"));
assert.deepEqual(
  calls(current, "createCriteriaCommitCell"),
  calls(original, "createCriteriaCommitCell"),
);
assert.equal(calls(current, "createLocal").length, 14);
let fixtures = 0;
for (const name of await readdir(new URL("./", import.meta.url))) {
  if (!/\.(ts|tsx)$/.test(name)) continue;
  parse(name, await readFile(new URL(name, import.meta.url), "utf8"));
  fixtures++;
}
console.log(
  `${unchanged} other host functions / ordered store own keys and other methods / one actual F3 constructor and 14 allocation sites unchanged; ${fixtures} own positive fixture files parsed. No application/runtime/negative modules loaded.`,
);
