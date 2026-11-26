import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../../../", import.meta.url);
const prefix = "packages/react/src/reordering-controller/";
async function source(name, before = false) {
  const path = `${prefix}${name}.ts`;
  const url = before
    ? new URL(`./preimages/${path.replaceAll("/", "__")}.txt`, import.meta.url)
    : new URL(path, root);
  const file = ts.createSourceFile(
    path,
    await readFile(url, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  assert.equal(file.parseDiagnostics.length, 0, path);
  return file;
}
function variables(file) {
  const result = new Map();
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    )
      result.set(node.name.text, node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return result;
}
const before = await source("admission", true),
  after = await source("admission");
const oldVars = variables(before),
  newVars = variables(after);
for (const name of [
  "readFrame",
  "readMetadata",
  "checkModel",
  "composed",
  "run",
  "validateReceipt",
  "validateCurrent",
  "snapshot",
])
  assert.equal(
    newVars.get(name).getText(after),
    oldVars.get(name).getText(before),
    `Frozen original ${name}`,
  );
for (const [name, addition] of [
  ["advanceFence", "    bridgeFenceChanged();\n"],
  ["purge", "      retireUI();\n"],
  ["publish", "    clearModelJoin();\n    touchUI();\n"],
])
  assert.equal(
    newVars.get(name).getText(after).replace(addition, ""),
    oldVars.get(name).getText(before),
    name,
  );
const oldImpl = oldVars.get("implementation"),
  newImpl = newVars.get("implementation");
assert(
  ts.isObjectLiteralExpression(oldImpl) &&
    ts.isObjectLiteralExpression(newImpl),
);
assert.deepEqual(
  newImpl.properties.map((node) => node.name.getText(after)),
  oldImpl.properties.map((node) => node.name.getText(before)),
);
oldImpl.properties.forEach((node, index) => {
  let current = newImpl.properties[index].getText(after);
  if (node.name.getText(before) === "commitModel")
    current = current.replace(
      "        clearModelJoin();\n        touchUI();\n",
      "",
    );
  assert.equal(
    current,
    node.getText(before),
    `Original admission method ${node.name.getText(before)}`,
  );
});
const oldTypes = await source("types", true),
  newTypes = await source("types");
for (const node of oldTypes.statements) {
  if (!ts.isInterfaceDeclaration(node)) continue;
  const current = newTypes.statements.find(
    (item) =>
      ts.isInterfaceDeclaration(item) && item.name.text === node.name.text,
  );
  assert(current);
  assert.equal(
    current.getText(newTypes),
    node.getText(oldTypes),
    `Original interface ${node.name.text}`,
  );
}
const values = [
  "createReorderController",
  "getReorderAdmissionOwner",
  "ReorderAdmissionError",
  "requireReorderAdmission",
  "claimReorderUI",
  "joinReorderModel",
  "requireReorderModel",
  "suspendReorderUI",
  "releaseReorderUI",
  "observeReorderUI",
  "captureReorderNavigation",
  "requireReorderNavigation",
].sort();
const types = [
  "ReorderAdmission",
  "ReorderAdmissionLease",
  "ReorderAdmissionOwner",
  "ReorderAdmissionSnapshot",
  "ReorderAdvanceReason",
  "ReorderApplicationMetadata",
  "ReorderControllerOptions",
  "ReorderControllerResult",
  "ReorderInteraction",
  "ReorderUIBinding",
  "ReorderModelJoin",
  "ReorderNavigationOrigin",
  "ReorderUIMetadata",
].sort();
const entry = await source("index"),
  actualValues = [],
  actualTypes = [];
assert(entry.getFullText().startsWith('"use client";'));
for (const node of entry.statements) {
  if (!ts.isExportDeclaration(node)) continue;
  assert(node.exportClause && ts.isNamedExports(node.exportClause));
  (node.isTypeOnly ? actualTypes : actualValues).push(
    ...node.exportClause.elements.map((item) => item.name.text),
  );
}
assert.deepEqual(actualValues.sort(), values);
assert.deepEqual(actualTypes.sort(), types);
for (const node of after.statements) {
  if (
    !ts.isInterfaceDeclaration(node) ||
    !["UIBindingRecord", "ModelJoinRecord", "NavigationRecord"].includes(
      node.name.text,
    )
  )
    continue;
  assert(
    !/DataTableModel|NativeRow|TableState|TableCommand|RowReorderFrame|pageIds|queryIdentity/.test(
      node.getText(after),
    ),
  );
}
for (const path of [
  "index",
  "contracts/index",
  "criteria/index",
  "reordering/index",
]) {
  const text = await readFile(
    new URL(`packages/react/src/${path}.ts`, root),
    "utf8",
  );
  assert(!text.includes("reordering-controller"), path);
}
console.log(
  "Static source only: original factory protected by scope; original admission method/interface/snapshot keys, callback composition/readFrame/U1 bodies exact; fixed lifecycle hooks only; explicit client allowlist 12 runtime/13 types; bridge proof records metadata-only; no root/pure helper edges. No runtime/own-key/cycle/SSR/packed execution.",
);
