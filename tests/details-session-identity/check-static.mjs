import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));
const hook = "packages/heroui/src/details/use-details-session.ts";
const modulePath = "packages/heroui/src/details/session-identity.ts";
const beforeText = await readFile(
  new URL("original-hook.before.txt", import.meta.url),
  "utf8",
);
const afterText = await readFile(`${root}${hook}`, "utf8");
const baseline = JSON.parse(
  await readFile(new URL("baseline.json", import.meta.url), "utf8"),
);
const hash = (text) => createHash("sha256").update(text).digest("hex");
assert.equal(
  hash(beforeText),
  baseline.originalHookSha256,
  "Preimage cannot be rebased",
);
const parse = (path, text) =>
  ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
const before = parse(hook, beforeText);
const after = parse(hook, afterText);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const print = (node, source) =>
  printer.printNode(ts.EmitHint.Unspecified, node, source).trim();
const expectedMount = parse(
  "expected.ts",
  "const [mount] = useState(() => Object.freeze({}));",
);
const expectedRecord = parse(
  "expected.ts",
  "recordDetailsSession(session, controller, mount);",
);
const expectedReturn = parse("expected.ts", "return session;");
let imports = 0;
let functions = 0;
const normalizedStatements = [];
for (const statement of after.statements) {
  if (
    ts.isImportDeclaration(statement) &&
    statement.moduleSpecifier.text === "./session-identity.js"
  ) {
    assert.equal(
      print(statement, after),
      'import { recordDetailsSession } from "./session-identity.js";',
    );
    imports++;
    continue;
  }
  if (
    !ts.isFunctionDeclaration(statement) ||
    statement.name?.text !== "useDetailsSession"
  ) {
    normalizedStatements.push(statement);
    continue;
  }
  functions++;
  assert.ok(statement.body);
  const body = [...statement.body.statements];
  const record = body.pop();
  const registration = body.pop();
  assert.equal(
    print(record, after),
    print(expectedReturn.statements[0], expectedReturn),
  );
  assert.equal(
    print(registration, after),
    print(expectedRecord.statements[0], expectedRecord),
  );
  const declaration = body.pop();
  assert.ok(ts.isVariableStatement(declaration));
  assert.equal(declaration.declarationList.declarations.length, 1);
  const session = declaration.declarationList.declarations[0];
  assert.equal(session.name.getText(after), "session");
  assert.equal(session.type.getText(after), "DetailsSession<S, T>");
  assert.ok(ts.isObjectLiteralExpression(session.initializer));
  let mounts = 0;
  const unchanged = body.filter((node) => {
    if (
      print(node, after) !== print(expectedMount.statements[0], expectedMount)
    )
      return true;
    mounts++;
    return false;
  });
  assert.equal(mounts, 1);
  unchanged.push(ts.factory.createReturnStatement(session.initializer));
  normalizedStatements.push(
    ts.factory.updateFunctionDeclaration(
      statement,
      statement.modifiers,
      statement.asteriskToken,
      statement.name,
      statement.typeParameters,
      statement.parameters,
      statement.type,
      ts.factory.updateBlock(statement.body, unchanged),
    ),
  );
}
assert.equal(imports, 1);
assert.equal(functions, 1);
const normalized = printer.printFile(
  ts.factory.updateSourceFile(after, normalizedStatements),
);
const original = printer.printFile(before);
assert.equal(
  normalized,
  original,
  "Policy/callback/context/raw return AST changed outside authorized scaffolding",
);

const identityText = await readFile(`${root}${modulePath}`, "utf8");
const identity = parse(modulePath, identityText);
for (const statement of identity.statements) {
  if (ts.isImportDeclaration(statement))
    assert.equal(statement.importClause.isTypeOnly, true);
}
const identityCalls = [];
function inspectIdentity(node) {
  if (ts.isCallExpression(node))
    identityCalls.push(node.expression.getText(identity));
  ts.forEachChild(node, inspectIdentity);
}
inspectIdentity(identity);
assert.deepEqual(identityCalls, ["owners.set", "Object.freeze", "owners.get"]);
const productionImporters = [];
const protectedSources = JSON.parse(
  await readFile(
    new URL("protected-sources-before.json", import.meta.url),
    "utf8",
  ),
);
for (const path of Object.keys(protectedSources).concat(hook)) {
  if (!/\.[cm]?tsx?$/.test(path)) continue;
  const source = parse(path, await readFile(`${root}${path}`, "utf8"));
  for (const statement of source.statements) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier?.text?.includes("session-identity")
    )
      productionImporters.push(path);
  }
}
assert.deepEqual(
  productionImporters,
  [hook],
  "Identity module must remain source-private to the actual producer",
);
const syntaxPaths = [hook, modulePath];
const scriptSyntaxPaths = [];
for (const entry of await readdir(new URL("./", import.meta.url))) {
  if (/\.(ts|tsx)$/.test(entry))
    syntaxPaths.push(`tests/details-session-identity/${entry}`);
  if (entry.endsWith(".mjs")) {
    const path = `tests/details-session-identity/${entry}`;
    const result = spawnSync(process.execPath, ["--check", `${root}${path}`], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    scriptSyntaxPaths.push(path);
  }
}
for (const path of syntaxPaths) {
  const source = parse(path, await readFile(`${root}${path}`, "utf8"));
  assert.equal(
    source.parseDiagnostics.length,
    0,
    `Syntax diagnostic in ${path}`,
  );
}
const result = {
  originalHookSha256: hash(beforeText),
  currentHookSha256: hash(afterText),
  identityModuleSha256: hash(identityText),
  normalizedAstSha256: hash(normalized),
  rawAstPreservedAfterExactScaffoldingRemoval: true,
  productionImporters,
  runtimeImportsInIdentityModule: 0,
  identityCalls,
  syntaxFiles: syntaxPaths.length,
  scriptSyntaxPaths,
  limits:
    "Static AST/import/syntax only; no hook, React, unit, type-negative or behavior execution.",
};
await mkdir(new URL(".artifacts/", import.meta.url), { recursive: true });
await writeFile(
  new URL(".artifacts/static.json", import.meta.url),
  `${JSON.stringify(result, null, 2)}\n`,
);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
