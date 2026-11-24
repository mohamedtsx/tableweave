import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const base = new URL("./.artifacts/emitted/", import.meta.url);
const entry = new URL("controller/criteria-publication.js", base);
const runtime = new Set();
const forbidden = new Set([
  "window",
  "document",
  "fetch",
  "localStorage",
  "sessionStorage",
  "navigator",
  "process",
  "globalThis",
  "Promise",
  "Date",
  "performance",
  "setTimeout",
  "setInterval",
  "WebSocket",
  "XMLHttpRequest",
  "eval",
]);
async function graph(file, declarations, visited) {
  if (visited.has(file.href)) return;
  visited.add(file.href);
  assert(
    file.href.startsWith(base.href),
    "Graph must stay in own private emission",
  );
  const text = await readFile(file, "utf8");
  const ast = ts.createSourceFile(
    file.pathname,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const imports = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      assert(ts.isStringLiteral(node.moduleSpecifier));
      const specifier = node.moduleSpecifier.text;
      assert(specifier.startsWith("."), `External dependency ${specifier}`);
      imports.push(
        new URL(
          declarations ? specifier.replace(/\.js$/, ".d.ts") : specifier,
          file,
        ),
      );
    }
    assert(
      !ts.isImportTypeNode(node),
      "Review inline declaration imports explicitly",
    );
    if (!declarations) {
      if (ts.isIdentifier(node))
        assert(
          !forbidden.has(node.text),
          `Forbidden runtime identifier ${node.text}`,
        );
      if (ts.isCallExpression(node))
        assert(
          node.expression.kind !== ts.SyntaxKind.ImportKeyword,
          "No dynamic imports",
        );
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "controller"
      )
        assert.fail(`Controller traversal ${node.name.text}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  for (const dependency of imports)
    await graph(dependency, declarations, visited);
}
await graph(entry, false, runtime);
assert.deepEqual(
  [...runtime].sort(),
  [entry.href, new URL("controller/criteria.js", base).href].sort(),
);
const declarations = new Set();
await graph(
  new URL("controller/criteria-publication.d.ts", base),
  true,
  declarations,
);

const source = await readFile(
  new URL(
    "../../packages/react/src/controller/criteria-publication.ts",
    import.meta.url,
  ),
  "utf8",
);
assert(source.includes("if (epoch === Number.MAX_SAFE_INTEGER)"));
assert(source.includes("exhausted = true;"));
assert(source.includes('failure("epoch-exhausted")'));
assert(source.includes("} else epoch++;"));
assert(!/initialEpoch|setEpoch|epoch\s*\+=/.test(source));

const script = `
import assert from 'node:assert/strict';
assert.equal('window' in globalThis, false);
assert.equal('document' in globalThis, false);
const listeners = process.listenerCount('unhandledRejection');
const m = await import(${JSON.stringify(entry.href)});
assert.deepEqual(Object.keys(m).sort(), ['CriteriaPublicationError','createCriteriaPublication','getCriteriaPublicationBinding'].sort());
let calls=0, retirement=0;
const opaque=new Proxy({}, {get(){calls++;throw 0},getPrototypeOf(){calls++;throw 0},getOwnPropertyDescriptor(){calls++;throw 0}});
const options={controller:opaque,definition:opaque,retirement:{retire(){retirement++}}};
m.createCriteriaPublication(options);
const p=m.createCriteriaPublication(options);
const context={definitionKey:'d',scopeKey:'s',access:false};
const r=p.begin({controller:opaque,definition:opaque,expected:context,actual:context});
assert.equal(r.status,'pending');
const a=p.issue({controller:opaque,definition:opaque,context,epoch:1});
assert.equal(m.getCriteriaPublicationBinding(a).publication,p);
assert.equal(p.complete(r.ticket).status,'settled');
assert.throws(()=>a.require());
assert.equal(calls,0);assert.equal(retirement,1);
assert.equal(Object.isFrozen(options),false);
assert.equal(process.listenerCount('unhandledRejection'),listeners);
console.log('Bare Node import/inert opaque capture passed; no DOM/rejection handlers.');
`;
process.stdout.write(
  execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
    encoding: "utf8",
  }),
);
console.log(
  `Runtime graph ${runtime.size} modules; declaration graph ${declarations.size} own files. Exhaustion guard source-reviewed, NOT 2^53 executions.`,
);
