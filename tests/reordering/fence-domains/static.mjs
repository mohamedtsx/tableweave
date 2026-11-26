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
const parse = (value) =>
  ts.createSourceFile(path, value, ts.ScriptTarget.Latest, true);
const before = parse(beforeText),
  after = parse(text);
assert.equal(after.parseDiagnostics.length, 0);
function variables(file) {
  const map = new Map();
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    )
      map.set(node.name.text, node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return map;
}
const a = variables(before),
  b = variables(after);
const methodNames = (node, file) =>
  (ts.isCallExpression(node) ? node.arguments[0] : node).properties.map(
    (item) => item.name.getText(file),
  );
assert.deepEqual(
  methodNames(a.get("implementation"), before),
  methodNames(b.get("implementation"), after),
);
assert.deepEqual(
  methodNames(a.get("snapshot"), before),
  methodNames(b.get("snapshot"), after),
);
const frameBody = (value) =>
  value.slice(
    value.indexOf("    const state = value.view.state;"),
    value.indexOf("  let failObservation"),
  );
assert.equal(
  frameBody(text),
  frameBody(beforeText),
  "Frozen U1 policy/stamp/extent/page-ID construction",
);
const factChecks = (value) =>
  value.slice(
    value.indexOf("    if (\n      !facts.displayed"),
    value.indexOf("    const before = readMetadata"),
  );
assert.equal(
  factChecks(text),
  factChecks(beforeText),
  "Native facts/membership/budgets unchanged",
);
for (const name of ["invoke", "update", "cleanupRegistration"])
  assert.equal(a.get(name).getText(before), b.get(name).getText(after), name);
const begin = b
  .get("implementation")
  .properties.find((node) => node.name.getText(after) === "begin");
assert(!begin.getText(after).includes("emit()"));
const tail = begin
  .getText(after)
  .split("result = coordinator.begin(slot.frame, placement);")[1];
assert(
  tail && !/readMetadata|readFrame|checkModel|\.require\(|emit\(/.test(tail),
);
for (const name of [
  "claimReorderUI",
  "joinReorderModel",
  "requireReorderModel",
  "suspendReorderUI",
  "releaseReorderUI",
  "observeReorderUI",
  "captureReorderNavigation",
  "requireReorderNavigation",
]) {
  const old = before.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
  const current = after.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
  assert.equal(current.getText(after), old.getText(before), name);
}
for (const path of [
  "index",
  "contracts/index",
  "criteria/index",
  "reordering/index",
])
  assert(
    !(
      await readFile(new URL(`packages/react/src/${path}.ts`, root), "utf8")
    ).includes("reordering-controller"),
  );
console.log(
  "Source AST only: original eight public bridge functions/method/snapshot shapes, callback invocation/update/cleanup and U1/native fact bodies preserved; begin tail callback-free; protected149 scope owns factory/types/index/pure/core/native history. No runtime own-key, SSR, cycle or installed-export claim.",
);
