import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";
import { root, own, changed, files } from "./scope.mjs";
const read = (file) => readFile(resolve(root, file), "utf8");
const candidate = ts.createSourceFile(
    "candidate.mjs",
    await read(changed[0]),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  ),
  driver = ts.createSourceFile(
    "driver.mjs",
    await read(changed[1]),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
function named(file, name) {
  const value = file.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
  assert(value, name);
  return value;
}
function calls(node, file) {
  const result = [];
  function visit(child) {
    if (ts.isCallExpression(child))
      result.push({ name: child.expression.getText(file), node: child });
    ts.forEachChild(child, visit);
  }
  visit(node);
  return result;
}
function requiresCall(node, file, name) {
  const found = calls(node, file).filter((call) => call.name === name);
  assert(found.length > 0, `${name} missing`);
  return found;
}
const profile = named(candidate, "verifyProfile"),
  baseline = calls(profile, candidate).filter(
    (call) => call.name === "baseline",
  ),
  current = requiresCall(profile, candidate, "current");
assert(baseline.length >= 3);
assert(
  baseline[0].node.pos < current[0].node.pos &&
    baseline.at(-1).node.pos > current[0].node.pos,
);
for (const name of [
  "validateProfileConfig",
  "localRac",
  "requireRuntimeMaps",
  "requireOrdinaryRuntimeMap",
  "requireIndependentFiles",
  "verifyMap",
  "inventory",
])
  requiresCall(profile, candidate, name);
requiresCall(named(candidate, "selectCandidate"), candidate, "packagedRac");
requiresCall(named(candidate, "selectCandidate"), candidate, "verifyProfile");
requiresCall(
  named(candidate, "selectCandidate"),
  candidate,
  "validateConsumerManifest",
);
requiresCall(profile, candidate, "validateConsumerManifest");
const descriptor = named(candidate, "validateRacDescriptor");
requiresCall(descriptor, candidate, "equivalent");
const runtimeMaps = named(candidate, "requireRuntimeMaps");
assert.deepEqual(
  requiresCall(runtimeMaps, candidate, "exactKeys").map((value) =>
    value.node.arguments[0].getText(candidate),
  ),
  ["profile.assets", "profile.before", "profile.after"],
);
requiresCall(
  named(candidate, "packagedRac"),
  candidate,
  "validateRacDescriptor",
);
requiresCall(named(candidate, "packagedRac"), candidate, "hash");
let constants;
for (const statement of candidate.statements)
  if (ts.isVariableStatement(statement))
    for (const declaration of statement.declarationList.declarations)
      if (declaration.name.getText(candidate) === "RAC_FILES")
        constants = declaration.initializer;
assert(constants);
const paths = [];
function fields(node) {
  if (
    ts.isPropertyAssignment(node) &&
    node.name.getText(candidate) === "path" &&
    ts.isStringLiteral(node.initializer)
  )
    paths.push(node.initializer.text);
  ts.forEachChild(node, fields);
}
fields(constants);
assert.deepEqual(paths, [
  "dist/private/Table.js",
  "dist/private/Table.mjs",
  "dist/private/Table.cjs",
]);
const canonicalProfile = JSON.parse(
  await read("packages/heroui/compat/rac-table-clone/profile.json"),
);
function literalObject(node) {
  assert(ts.isObjectLiteralExpression(node));
  return Object.fromEntries(
    node.properties.map((property) => {
      assert(
        ts.isPropertyAssignment(property) &&
          ts.isStringLiteral(property.initializer),
      );
      return [
        ts.isStringLiteral(property.name)
          ? property.name.text
          : property.name.getText(candidate),
        property.initializer.text,
      ];
    }),
  );
}
let canonicalFiles;
function inspectMetadata(node) {
  if (
    ts.isArrayLiteralExpression(node) &&
    node.elements.length === 3 &&
    node.elements.every(ts.isObjectLiteralExpression)
  )
    canonicalFiles = node.elements.map(literalObject);
  ts.forEachChild(node, inspectMetadata);
}
inspectMetadata(constants);
assert.deepEqual(canonicalFiles, canonicalProfile.files);
for (const statement of candidate.statements)
  if (ts.isVariableStatement(statement))
    for (const declaration of statement.declarationList.declarations)
      if (declaration.name.getText(candidate) === "RAC_COMPANIONS") {
        assert(ts.isCallExpression(declaration.initializer));
        assert.deepEqual(
          literalObject(declaration.initializer.arguments[0]),
          canonicalProfile.assets,
        );
      }
for (const name of [
  "boundedOwnedWait",
  "runOwnedCleanup",
  "finishOwnedTrace",
  "closeOwnedContext",
  "closeOwnedServer",
])
  named(driver, name);
requiresCall(named(driver, "runOwnedCleanup"), driver, "boundedOwnedWait");
const wait = named(driver, "boundedOwnedWait");
requiresCall(wait, driver, "setTimeout");
requiresCall(wait, driver, "clearTimeout");
requiresCall(wait, driver, "Object.freeze");
let finish;
function finishNode(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "finish")
    finish = node;
  if (ts.isVariableDeclaration(node) && node.name.getText(driver) === "finish")
    finish = node.initializer;
  ts.forEachChild(node, finishNode);
}
finishNode(wait);
assert(finish && ts.isBlock(finish.body));
assert(ts.isIfStatement(finish.body.statements[0]));
assert.equal(finish.body.statements[0].expression.getText(driver), "decided");
requiresCall(named(driver, "serve"), driver, "createServer");
requiresCall(named(driver, "serve"), driver, "closeOwnedServer");
for (const name of [
  "finishOwnedTrace",
  "closeOwnedContext",
  "closeOwnedServer",
])
  requiresCall(named(driver, name), driver, "runOwnedCleanup");
const session = named(driver, "session");
for (const name of [
  "requireOwnedWait",
  "finishOwnedTrace",
  "closeOwnedContext",
  "retainPrimary",
])
  requiresCall(session, driver, name);
const execute = named(driver, "execute");
requiresCall(execute, driver, "retainPrimary");
const text = driver.text;
assert(!/\.kill\(|process\.kill|pkill|rmSync|unlinkSync/.test(text));
let debtBranch;
function inspectDebt(node) {
  if (
    ts.isIfStatement(node) &&
    node.expression.getText(driver) === "cleanupDebts.length"
  )
    debtBranch = node;
  ts.forEachChild(node, inspectDebt);
}
inspectDebt(session);
assert(debtBranch && ts.isBlock(debtBranch.thenStatement));
requiresCall(debtBranch.thenStatement, driver, "retainPrimary");
const debtPut = requiresCall(debtBranch.thenStatement, driver, "put")[0].node;
assert(ts.isObjectLiteralExpression(debtPut.arguments[2]));
const receiptProperties = debtPut.arguments[2].properties;
assert(
  receiptProperties.some(
    (value) =>
      ts.isPropertyAssignment(value) &&
      value.name.getText(driver) === "status" &&
      ts.isStringLiteral(value.initializer) &&
      value.initializer.text === "HOLD_UNRESOLVED_OWNED_CLEANUP_DEBT",
  ),
);
for (const key of ["attempts", "debts", "primary", "capturedSamples"])
  assert(
    receiptProperties.some(
      (value) =>
        ts.isPropertyAssignment(value) && value.name.getText(driver) === key,
    ),
  );
const sessionThrow = session.body.statements.find(
  (node) =>
    ts.isIfStatement(node) &&
    node.expression.getText(driver) === "primary" &&
    ts.isThrowStatement(node.thenStatement),
);
assert(sessionThrow);
const sessionPut = requiresCall(session, driver, "put").find((value) =>
  value.node.arguments[1].getText(driver).includes("/session.json"),
);
assert(sessionPut && sessionPut.node.pos > sessionThrow.end);
const executeTry = execute.body.statements.find(ts.isTryStatement);
assert(executeTry?.finallyBlock);
requiresCall(executeTry.finallyBlock, driver, "close");
const executeThrow = execute.body.statements.find(
  (node) =>
    ts.isIfStatement(node) &&
    node.expression.getText(driver) === "primary" &&
    ts.isThrowStatement(node.thenStatement),
);
assert(executeThrow && executeThrow.pos >= executeTry.finallyBlock.end);
const observations = requiresCall(execute, driver, "put").find((value) =>
  value.node.arguments[1].getText(driver).includes("/observations.json"),
);
assert(observations && observations.node.pos > executeThrow.end);
// Reject direct formerly-unbounded close/end awaits in session; operations live in
// explicit bounded task callbacks instead. This inspects actual call nesting.
function awaitSites(node) {
  if (
    ts.isCallExpression(node) &&
    ["window.wp14.end", "window.wp14?.end"].includes(
      node.expression.getText(driver),
    )
  ) {
    let parent = node.parent,
      guarded = false;
    while (parent && parent !== session) {
      if (
        ts.isCallExpression(parent) &&
        ["requireOwnedWait", "runOwnedCleanup"].includes(
          parent.expression.getText(driver),
        )
      )
        guarded = true;
      parent = parent.parent;
    }
    assert(guarded, "Unbounded source-end path");
  }
  if (ts.isAwaitExpression(node) && ts.isCallExpression(node.expression)) {
    const name = node.expression.expression.getText(driver);
    assert(
      !["context.close", "cdp.send", "cdp.detach", "preflight.detach"].includes(
        name,
      ),
      `Unbounded session await ${name}`,
    );
  }
  ts.forEachChild(node, awaitSites);
}
awaitSites(session);
for (const file of [
  ...changed,
  ...(await files(own)).filter(
    (path) => !path.startsWith(`${own}evidence/`) && /\.(ts|mjs)$/.test(path),
  ),
]) {
  const source = await read(file),
    ast = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS,
    );
  assert.equal(ast.parseDiagnostics.length, 0, file);
  if (file.endsWith(".ts"))
    assert(
      !/as unknown as|\bas any\b|@ts-ignore|@ts-expect-error|\b(?:it|test)\.(?:skip|only|todo)/.test(
        source,
      ),
      file,
    );
}
for (const file of (await files(own)).filter((path) => path.endsWith(".md")))
  for (const match of (await read(file)).matchAll(/\]\(([^)]+)\)/g)) {
    const target = resolve(root, file, "..", match[1].split("#")[0]);
    assert(target.startsWith(`${resolve(root, own)}/`));
    await readFile(target);
  }
console.log(
  "AST source guards: canonical profile set/config/independent before-current-after checks; bounded trace/context/server orchestration/debt retention. NOT executed conformance or cleanup proof.",
);
