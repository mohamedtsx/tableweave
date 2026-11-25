import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";

// Read/parse source only; never imports corrected helpers or authored test bodies.
const own = "tests/consumers/wp13-storage-correction";
function parse(file) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  assert.equal(source.parseDiagnostics.length, 0);
  return source;
}
function nodes(root, predicate, out = []) {
  if (predicate(root)) out.push(root);
  ts.forEachChild(root, (n) => {
    nodes(n, predicate, out);
  });
  return out;
}
const fn = (root, name) =>
  nodes(root, (n) => ts.isFunctionDeclaration(n) && n.name?.text === name)[0];
const calls = (root, name) =>
  nodes(root, (n) => ts.isCallExpression(n) && n.expression.getText() === name);
const runtime = parse("tests/consumers/wp13/lib/runtime.mjs");
const oldRuntime = parse(`${own}/before-001/runtime.mjs.preimage.txt`);
const current = fn(runtime, "runFamily"),
  prior = fn(oldRuntime, "runFamily");
assert.equal(
  runtime.text
    .slice(0, current.getStart())
    .replace(
      'import { local, revalidate, ownedConsumer } from "./boundary.mjs";',
      'import { local, revalidate } from "./boundary.mjs";',
    ),
  oldRuntime.text.slice(0, prior.getStart()),
  "Only ownedConsumer import may change outside runFamily",
);
assert.equal(
  runtime.text.slice(current.end),
  oldRuntime.text.slice(prior.end),
  "Runtime suffix frozen",
);
for (const old of oldRuntime.statements.filter(ts.isFunctionDeclaration))
  if (old.name.text !== "runFamily")
    assert.equal(
      fn(runtime, old.name.text).getFullText(),
      old.getFullText(),
      `Frozen runtime function ${old.name.text}`,
    );
const failureStart = (node) =>
  node.body.statements
    .find(
      (n) =>
        ts.isVariableStatement(n) &&
        n.declarationList.declarations.some(
          (d) => d.name.getText() === "failure",
        ),
    )
    .getStart();
assert.equal(
  runtime.text.slice(current.getStart(), failureStart(current)),
  oldRuntime.text.slice(prior.getStart(), failureStart(prior)),
  "Frozen runtime preconditions/staging",
);
const storage = parse("tests/consumers/wp13/lib/storage-roots.mjs"),
  oldStorage = parse(`${own}/before-001/storage-roots.mjs.preimage.txt`);
const consumer = fn(storage, "consumerStorage"),
  oldConsumer = fn(oldStorage, "consumerStorage");
assert.equal(
  storage.text.slice(0, consumer.getStart()),
  oldStorage.text.slice(0, oldConsumer.getStart()),
  "Storage prefix frozen",
);
assert.equal(
  storage.text.slice(consumer.end),
  oldStorage.text.slice(oldConsumer.end),
  "Storage suffix frozen",
);
assert.ok(
  calls(consumer, "physical")[0].pos < calls(consumer, "capture")[0].pos,
);
assert.ok(
  calls(consumer, "state.consumers.get")[0].pos <
    calls(consumer, "capture")[0].pos,
);
assert.ok(
  calls(consumer, "state.consumers.set")[0].pos >
    calls(consumer, "capture")[0].pos,
);
assert.ok(
  calls(consumer, "physical")[1].pos > calls(consumer, "capture")[0].pos,
);
for (const name of ["prepared.key", "prepared.candidate", "prepared.profile"]) {
  const fields = nodes(
    consumer,
    (n) => ts.isPropertyAccessExpression(n) && n.getText() === name,
  );
  assert.ok(
    fields.length > 0 &&
      fields.every((n) => n.pos < calls(consumer, "capture")[0].pos),
  );
}
const inventory = calls(current, "tree").find(
    (n) => n.pos > failureStart(current),
  ),
  record = calls(current, "record")[1];
// The first record() is before the leased tail (attempt input).
assert.ok(
  inventory &&
    record &&
    calls(current, "ownedConsumer").some((n) => n.pos < inventory.pos),
);
assert.ok(
  calls(current, "ownedConsumer").some(
    (n) => n.pos > inventory.pos && n.pos < record.pos,
  ),
);
const postflight = nodes(current, ts.isTryStatement).find(
  (n) => calls(n.tryBlock, "toolchain").length > 0,
);
assert.ok(postflight);
assert.ok(
  calls(postflight.tryBlock, "ownedConsumer")[0].pos <
    calls(postflight.tryBlock, "installed")[0].pos,
);
assert.ok(
  nodes(postflight.catchClause, ts.isThrowStatement).some(
    (n) =>
      ts.isCallExpression(n.expression) &&
      n.expression.expression.getText() === "abort",
  ),
);
assert.equal(
  nodes(
    current,
    (n) =>
      ts.isBinaryExpression(n) &&
      n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionEqualsToken,
  ).length,
  0,
);
const executeTry = nodes(current, ts.isTryStatement).find(
  (n) => calls(n.tryBlock, "execute").length > 0,
);
assert.ok(nodes(executeTry.catchClause, ts.isThrowStatement).length > 0);
assert.ok(
  nodes(executeTry.catchClause, ts.isStringLiteral).some(
    (n) => n.text === "E_CHILD_FAILURE_RETAINED",
  ),
);
assert.ok(
  calls(current, "ownedConsumer")[0].pos <
    calls(current, "json").find((n) =>
      n.arguments[1]?.getText().includes("report.json"),
    ).pos,
);
const aggregate = nodes(fn(current, "abort"), ts.isNewExpression).find(
  (n) => n.expression.getText() === "AggregateError",
);
assert.ok(aggregate && aggregate.arguments[0].getText() === "[failure, error]");
console.log(
  JSON.stringify({
    status: "AST/source-boundary-only-not-runtime-or-MJS-type-proof",
    modules: 2,
    frozenOtherFunctionBodies: true,
    guardsAuthoredUnrun: true,
  }),
);
