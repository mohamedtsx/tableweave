import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";

// Parse source only. Never imports a driver/helper or executes its callbacks.
const own = "tests/consumers/wp13";
function parse(file) {
  const text = fs.readFileSync(`${own}/${file}`, "utf8");
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  assert.equal(source.parseDiagnostics.length, 0);
  return source;
}
function descendants(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  ts.forEachChild(node, (child) => {
    descendants(child, predicate, out);
  });
  return out;
}
const calls = (node, name) =>
  descendants(
    node,
    (n) => ts.isCallExpression(n) && n.expression.getText() === name,
  );
const fn = (source, name) =>
  descendants(
    source,
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  )[0];
const cli = parse("cli.mjs"),
  main = fn(cli, "main");
assert.ok(
  calls(main, "parseStorageArguments")[0].pos < calls(main, "load")[0].pos,
);
assert.ok(
  calls(main, "revalidate")[0].pos < calls(main, "producerInputs")[0].pos,
);
assert.ok(
  descendants(cli, ts.isStringLiteral).some(
    (n) => n.text === "lib/storage-roots.mjs",
  ),
);
const catches = descendants(main, ts.isCatchClause);
assert.ok(
  calls(catches[0], "revalidate")[0].pos < calls(catches[0], "record")[0].pos,
);
assert.ok(
  descendants(catches[1], ts.isNewExpression).some(
    (n) => n.expression.getText() === "AggregateError",
  ),
);
const generation = parse("lib/generation.mjs"),
  execute = fn(generation, "execute");
const child = calls(execute, "spawnSync")[0];
assert.ok(child);
const after = calls(execute, "revalidate").find((n) => n.pos > child.pos);
assert.ok(after && after.pos < calls(execute, "write")[0].pos);
assert.ok(calls(fn(generation, "safeEnvironment"), "scratch").length === 1);
assert.ok(
  calls(fn(generation, "generate"), "scratch").some(
    (n) => n.pos < calls(fn(generation, "generate"), "execute")[0].pos,
  ),
);
const installer = parse("lib/installer.mjs");
for (const call of calls(installer, "external"))
  assert.equal(call.arguments[3]?.getText(), "ctx");
assert.ok(
  calls(fn(installer, "prepare"), "capacity").some(
    (n) => n.arguments[0]?.getText() === "selectedRoots(ctx).namespace",
  ),
);
assert.ok(
  calls(fn(installer, "prepare"), "captureConsumer")[0].pos <
    calls(fn(installer, "prepare"), "record")[0].pos,
);
assert.ok(calls(fn(installer, "verifyProfile"), "consumerStorage").length > 0);
for (const file of [
  "cli.mjs",
  "lib/boundary.mjs",
  "lib/installer.mjs",
  "lib/generation.mjs",
]) {
  const source = parse(file);
  assert.ok(
    !descendants(source, ts.isStringLiteral).some((n) =>
      n.text.startsWith("/mnt/data/"),
    ),
  );
}
const roots = parse("lib/storage-roots.mjs");
assert.equal(
  descendants(
    roots,
    (n) => ts.isNewExpression(n) && n.expression.getText() === "WeakMap",
  ).length,
  2,
);
for (const name of ["openStorage", "storageControl", "bindStorage"])
  assert.equal(calls(fn(roots, name), "fs.mkdirSync").length, 0);
for (const statement of roots.statements) {
  if (ts.isFunctionDeclaration(statement) || ts.isImportDeclaration(statement))
    continue;
  assert.ok(
    ts.isVariableStatement(statement),
    "storage module has an executing top-level statement",
  );
  assert.equal(
    descendants(statement, ts.isCallExpression).length,
    0,
    "storage module calls a function at import",
  );
}
assert.ok(calls(fn(roots, "check"), "physical").length >= 5);
assert.ok(calls(fn(roots, "check"), "capture").length > 0);
assert.ok(
  calls(fn(roots, "storageExternal"), "context")[0].pos <
    calls(fn(roots, "storageExternal"), "directory")[0].pos,
);
assert.ok(calls(fn(roots, "storageExternal"), "present").length > 0);
assert.ok(calls(fn(roots, "consumerStorage"), "physical").length > 0);
assert.ok(calls(fn(roots, "bindStorage"), "rejectForeignRoots").length > 0);
console.log(
  JSON.stringify({
    status: "source-AST-only-not-runtime-or-MJS-semantic-check",
    modules: 5,
    limits: "AST control paths only; no helper imports or runtime assertions",
  }),
);
