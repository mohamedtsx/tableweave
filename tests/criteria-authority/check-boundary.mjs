import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const emitted = new URL("./.artifacts/emitted/", import.meta.url);
const entry = new URL("controller/criteria.js", emitted);
const code = await readFile(entry, "utf8");
const source = ts.createSourceFile(
  entry.pathname,
  code,
  ts.ScriptTarget.Latest,
  true,
);
const forbiddenNames = new Set([
  "React",
  "Promise",
  "window",
  "document",
  "fetch",
  "localStorage",
  "sessionStorage",
  "navigator",
  "process",
  "globalThis",
  "require",
  "eval",
  "Function",
  "WebSocket",
  "XMLHttpRequest",
  "setTimeout",
  "setInterval",
  "Date",
  "performance",
]);
const forbiddenPorts = new Set([
  "getSnapshot",
  "getServerSnapshot",
  "subscribe",
  "connect",
  "dispatch",
  "accept",
  "reject",
  "dispose",
  "setContext",
  "query",
  "rows",
  "evaluatedAt",
  "now",
]);
let imports = 0;
function inspect(node) {
  if (
    ts.isImportDeclaration(node) ||
    (ts.isExportDeclaration(node) && node.moduleSpecifier)
  )
    imports++;
  if (ts.isIdentifier(node)) {
    const publicMethodName =
      node.text === "require" &&
      ts.isMethodDeclaration(node.parent) &&
      node.parent.name === node;
    assert(
      publicMethodName || !forbiddenNames.has(node.text),
      `Forbidden runtime identifier ${node.text}`,
    );
  }
  if (ts.isStringLiteral(node))
    assert(
      !forbiddenPorts.has(node.text),
      `Forbidden controller/lifetime port ${node.text}`,
    );
  if (ts.isPropertyAccessExpression(node))
    assert(
      !forbiddenPorts.has(node.name.text),
      `Forbidden state/lifetime property ${node.name.text}`,
    );
  if (ts.isCallExpression(node))
    assert(
      node.expression.kind !== ts.SyntaxKind.ImportKeyword,
      "No dynamic runtime dependency",
    );
  ts.forEachChild(node, inspect);
}
inspect(source);
assert.equal(
  imports,
  0,
  "Plain runtime entry must have zero runtime imports/reexports",
);

const pending = [new URL("controller/criteria.d.ts", emitted)];
const visited = new Set();
while (pending.length) {
  const file = pending.pop();
  if (visited.has(file.href)) continue;
  visited.add(file.href);
  assert(
    file.href.startsWith(emitted.href),
    "Declaration graph escaped private emission",
  );
  const text = await readFile(file, "utf8");
  const ast = ts.createSourceFile(
    file.pathname,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      assert(
        specifier.startsWith("."),
        `External declaration dependency ${specifier}`,
      );
      assert(
        !/(tanstack|heroui|presentation|resource\/(hook|adapter)|react|storage|network)/i.test(
          specifier,
        ),
        `Forbidden declaration dependency ${specifier}`,
      );
      pending.push(new URL(specifier.replace(/\.js$/, ".d.ts"), file));
    }
    if (ts.isImportTypeNode(node))
      throw new Error("Review new inline declaration imports explicitly");
    ts.forEachChild(node, visit);
  }
  visit(ast);
}

const script = `
import assert from 'node:assert/strict';
assert.equal('window' in globalThis, false);
assert.equal('document' in globalThis, false);
const listeners = process.listenerCount('unhandledRejection');
const m = await import(${JSON.stringify(entry.href)});
assert.deepEqual(Object.keys(m).sort(), ['CriteriaAuthorityError','createCriteriaAuthority','getCriteriaAuthorityOrigin','requireCriteriaAuthority'].sort());
let calls = 0;
const opaque = new Proxy({}, {get(){calls++;throw new Error('No opaque reads');},getOwnPropertyDescriptor(){calls++;throw new Error('No method captures');},preventExtensions(){calls++;throw new Error('No app freezing');}});
const input = {origin:{controller:opaque,definition:opaque,context:{definitionKey:'d',scopeKey:'s',access:false},epoch:0},readCurrent(){calls++;throw new Error('Denied reader');}};
const a = m.createCriteriaAuthority(input);
assert.equal(m.getCriteriaAuthorityOrigin(a).controller,opaque);
assert.throws(()=>a.require(),m.CriteriaAuthorityError);
assert.equal(calls,0);
assert.equal(Object.isFrozen(input),false);
assert.equal(Object.isFrozen(input.origin),false);
assert.equal(process.listenerCount('unhandledRejection'),listeners);
console.log('Bare Node ESM import/inert denied runtime passed without DOM or rejection handlers.');
`;
process.stdout.write(
  execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: fileURLToPath(new URL("./", import.meta.url)),
    encoding: "utf8",
  }),
);
console.log(
  `Private runtime: zero imports; declaration graph: ${visited.size} own files. Not a tarball or UI/framework proof.`,
);
