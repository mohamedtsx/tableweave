import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const root = new URL("../../../", import.meta.url);
const path = "packages/react/src/reordering-controller/admission.ts";
const beforeText = await readFile(
  new URL("./preimages/admission.ts.txt", import.meta.url),
  "utf8",
);
const text = await readFile(new URL(path, root), "utf8");
const parse = (value, name = path) =>
  ts.createSourceFile(name, value, ts.ScriptTarget.Latest, true);
const before = parse(beforeText),
  after = parse(text);
assert.equal(after.parseDiagnostics.length, 0);
function declarations(file) {
  const map = new Map();
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    )
      map.set(node.name.text, node.initializer);
    if (ts.isFunctionDeclaration(node) && node.name)
      map.set(node.name.text, node);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return map;
}
const a = declarations(before),
  b = declarations(after);
for (const name of [
  "invoke",
  "emit",
  "schedule",
  "callback",
  "composed",
  "validateReceipt",
  "validateCurrent",
  "readMetadata",
  "checkModel",
  "sameSourceModel",
  "sourceSignature",
  "readyToObserve",
])
  assert.equal(
    b.get(name).getText(after),
    a.get(name).getText(before),
    `Frozen B2 ${name}`,
  );
const coordinatorCall = b.get("coordinator"),
  oldConstructor = a.get("coordinator");
assert.equal(
  coordinatorCall.expression.getText(after),
  oldConstructor.expression.getText(before),
);
assert.equal(coordinatorCall.arguments.length, 1);
assert.deepEqual(
  coordinatorCall.arguments[0].properties.map((node) =>
    node.name.getText(after),
  ),
  ["instanceId", "readCurrent"],
);
assert.equal(
  coordinatorCall.arguments[0].properties[0].getText(after),
  oldConstructor.arguments[0].properties[0].getText(before),
);
const port = coordinatorCall.arguments[0].properties.find(
  (node) => node.name.getText(after) === "readCurrent",
);
const oldPort = oldConstructor.arguments[0].properties.find(
  (node) => node.name.getText(before) === "readCurrent",
);
const portTry = port.body.statements.find(ts.isTryStatement);
const oldTry = oldPort.body.statements.find(ts.isTryStatement);
assert.equal(
  portTry.catchClause.getText(after),
  oldTry.catchClause.getText(before),
  "Original adapter failure classification",
);
assert.equal(
  portTry.tryBlock.statements[0].declarationList.declarations[0].initializer.getText(
    after,
  ),
  "readFrame(ids)",
);
const exitGuard = portTry.tryBlock.statements[1];
assert(ts.isIfStatement(exitGuard));
assert.equal(exitGuard.expression.getText(after), "attempt");
assert.equal(
  exitGuard.thenStatement.expression.expression.getText(after),
  "checkAt",
);
assert.deepEqual(
  exitGuard.thenStatement.expression.arguments[0].properties.map((node) =>
    node.name.getText(after),
  ),
  ["source", "ui", "lease", "physical"],
);
assert.equal(portTry.tryBlock.statements[2].expression.getText(after), "frame");
const oldImpl = a.get("implementation"),
  current = b.get("implementation");
assert.deepEqual(
  current.properties.map((node) => node.name.getText(after)),
  oldImpl.properties.map((node) => node.name.getText(before)),
);
for (const node of oldImpl.properties) {
  if (["capture", "begin", "getSnapshot"].includes(node.name.getText(before)))
    continue;
  const now = current.properties.find(
    (item) => item.name.getText(after) === node.name.getText(before),
  );
  assert.equal(
    now.getText(after),
    node.getText(before),
    `Original method ${node.name.getText(before)}`,
  );
}
assert.equal(
  b.get("snapshot").getText(after),
  a.get("snapshot").getText(before),
);
const frameTail = (value) =>
  value.slice(
    value.indexOf("    const value = checkModel(expected, role);"),
    value.indexOf("  let failObservation"),
  );
assert.equal(
  frameTail(text),
  frameTail(beforeText),
  "Original native/eligibility/U1/frame body unchanged",
);
const begin = current.properties.find(
  (node) => node.name.getText(after) === "begin",
);
const tail = begin
  .getText(after)
  .split("result = coordinator.begin(slot.frame, placement);")[1];
assert(
  tail &&
    !/readMetadata|readFrame|checkModel|\.require\(|emit\(|schedule\(/.test(
      tail,
    ),
);
const revoke = b.get("revokeReorderInteraction");
assert(ts.isFunctionDeclaration(revoke));
assert.equal(revoke.parameters[0].type.kind, ts.SyntaxKind.UnknownKeyword);
assert.equal(revoke.type.getText(after), "undefined");
const calls = [];
function visit(node) {
  if (ts.isCallExpression(node)) calls.push(node.expression.getText(after));
  ts.forEachChild(node, visit);
}
visit(revoke);
assert.deepEqual(
  calls,
  ["interactionCuts.get"],
  "Release has no source/app/reflection/scheduler calls",
);
assert(
  !/controller|coordinator|boundary|fence|model|metadata|snapshot|notify|Promise|Reflect/.test(
    revoke.body.getText(after),
  ),
);
function callNodes(node) {
  const result = [];
  function walk(current) {
    if (ts.isCallExpression(current)) result.push(current);
    ts.forEachChild(current, walk);
  }
  walk(node);
  return result;
}
const creation = callNodes(begin).find(
  (node) => node.expression.getText(after) === "coordinator.begin",
);
for (const node of callNodes(begin).filter(
  (node) => node.getStart(after) > creation.end,
))
  assert(
    ["deny", "Object.freeze", "coordinator.getSnapshot"].includes(
      node.expression.getText(after),
    ),
    "Fixed-only post-creation calls",
  );
const observer = (file) =>
  callNodes(file).find(
    (node) => node.expression.getText(file) === "coordinator.subscribe",
  );
assert.equal(
  observer(after).getText(after),
  observer(before).getText(before),
  "Original synchronous port-free self-pending credit",
);
const physical = after.statements.find(
  (node) =>
    ts.isInterfaceDeclaration(node) && node.name.text === "InteractionCut",
);
assert.equal(physical.members.length, 1);
assert.equal(physical.members[0].name.getText(after), "revoked");
assert.equal(physical.members[0].type.kind, ts.SyntaxKind.BooleanKeyword);
const flag = b.get("physical");
assert(ts.isObjectLiteralExpression(flag));
assert.equal(flag.properties.length, 1);
assert.equal(flag.properties[0].name.getText(after), "revoked");
assert.equal(flag.properties[0].initializer.kind, ts.SyntaxKind.FalseKeyword);
function monotonic(node) {
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isPropertyAccessExpression(node.left) &&
    node.left.name.text === "revoked"
  )
    assert.equal(
      node.right.kind,
      ts.SyntaxKind.TrueKeyword,
      "Irreversible physical release",
    );
  ts.forEachChild(node, monotonic);
}
monotonic(after);
const entry = parse(
  await readFile(
    new URL("packages/react/src/reordering-controller/index.ts", root),
    "utf8",
  ),
);
const oldEntry = parse(
  await readFile(new URL("./preimages/index.ts.txt", import.meta.url), "utf8"),
);
assert.equal(
  entry.getFullText().replace("  revokeReorderInteraction,\n", ""),
  oldEntry.getFullText(),
  "Only the selected additive client export; original use-client graph intact",
);
const exports = (file, types) =>
  file.statements
    .filter((node) => ts.isExportDeclaration(node) && node.isTypeOnly === types)
    .flatMap((node) => node.exportClause.elements.map((item) => item.name.text))
    .sort();
assert.deepEqual(
  exports(entry, false),
  [...exports(oldEntry, false), "revokeReorderInteraction"].sort(),
);
assert.equal(exports(entry, false).length, 13);
assert.deepEqual(exports(entry, true), exports(oldEntry, true));
assert.equal(exports(entry, true).length, 13);
for (const name of [
  "claimReorderUI",
  "joinReorderModel",
  "requireReorderModel",
  "suspendReorderUI",
  "releaseReorderUI",
  "observeReorderUI",
  "captureReorderNavigation",
  "requireReorderNavigation",
])
  assert.equal(b.get(name).getText(after), a.get(name).getText(before), name);
console.log(
  "Static source only: exact release body/one-bit weak record, additive13/13 entry, existing bridge/method/snapshot keys, B2 callbacks/coordinator constructor and adapter failure body/U1/native facts; final ACT exit guard and callback-free begin tail. Protected148 scope owns all other sources, types, factory, manifests and old entry maps. No runtime/GC/own-key/SSR/import graph proof.",
);
