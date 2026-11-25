import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import ts from "typescript";
import { capacity, leased, root } from "./scope.mjs";

await capacity();
const read = (path) => readFile(resolve(root, path), "utf8");
const runtime = await read("tests/integration/wp12/vite.config.ts");
const parsed = ts.createSourceFile(
  "vite.config.ts",
  runtime,
  ts.ScriptTarget.Latest,
  true,
);
let entries;
function visit(node) {
  if (
    ts.isVariableDeclaration(node) &&
    node.name.getText(parsed) === "entries" &&
    node.initializer &&
    ts.isAsExpression(node.initializer)
  ) {
    assert(ts.isArrayLiteralExpression(node.initializer.expression));
    entries = node.initializer.expression.elements.map((pair) => {
      assert(ts.isArrayLiteralExpression(pair));
      return pair.elements.map((value) => {
        assert(ts.isStringLiteral(value));
        return value.text;
      });
    });
  }
  ts.forEachChild(node, visit);
}
visit(parsed);
assert.equal(entries?.length, 7);
const react = JSON.parse(await read("packages/react/package.json")),
  heroui = JSON.parse(await read("packages/heroui/package.json"));
for (const [specifier, target] of entries) {
  const styled = specifier.startsWith("@tableweave/heroui"),
    pkg = styled ? heroui : react;
  const name = styled ? "@tableweave/heroui" : "@tableweave/react";
  const key = specifier === name ? "." : `.${specifier.slice(name.length)}`;
  const exported = pkg.exports[key];
  assert(exported, specifier);
  assert.equal(
    target,
    `${styled ? "heroui" : "react"}/${(typeof exported === "string" ? exported : exported.import).slice(2)}`,
  );
}
assert(!/packages\/[^"\n]*\/src\//.test(runtime));
assert(runtime.includes("6574") && runtime.includes("strictPort: true"));
const browserConfig = await read("tests/integration/wp12/playwright.config.ts");
for (const fragment of [
  "reuseExistingServer: false",
  "workers: 1",
  "retries: 0",
  'name: "chromium"',
  'name: "firefox"',
  'name: "webkit"',
])
  assert(browserConfig.includes(fragment), fragment);
const tests = await read("tests/integration/wp12/browser.spec.ts");
assert(!/\b(?:test|it)\.(?:skip|fixme|fail|only)\s*\(/.test(tests));
for (let flow = 1; flow <= 6; flow++) assert(tests.includes(`I${flow} —`));
for (const width of [320, 390, 768, 1024, 1440])
  assert(tests.includes(String(width)));
assert(
  tests.includes('event.channel === "C"') &&
    tests.includes('event.channel === "P"'),
);
assert(tests.includes("review27n1") && tests.includes("toBeGreaterThan(0)"));

// Traverse only application SOURCE syntax/imports, never import its module body.
const seen = new Set();
async function graph(path) {
  if (seen.has(path)) return;
  seen.add(path);
  assert(
    !path.includes("/src/workbench/") &&
      !path.includes("/src/controls/") &&
      !path.startsWith("packages/"),
    path,
  );
  const source = ts.createSourceFile(
    path,
    await read(path),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  for (const node of source.statements) {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier) ||
      node.importClause?.isTypeOnly
    )
      continue;
    const name = node.moduleSpecifier.text;
    assert(
      !name.includes("storybook") &&
        !name.includes("sortable") &&
        !name.includes("dnd"),
      name,
    );
    if (name.startsWith("@tableweave/"))
      assert(
        entries.some(([entry]) => entry === name),
        name,
      );
    if (name.startsWith(".") && !name.endsWith(".css")) {
      const base = relative(root, resolve(root, dirname(path), name)).replace(
        /\.js$/,
        "",
      );
      let resolved;
      for (const extension of [".ts", ".tsx"]) {
        try {
          await read(base + extension);
          resolved = base + extension;
          break;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
      assert(resolved, name);
      await graph(resolved);
    }
  }
}
await graph("tests/integration/wp12/main.tsx");
const app = await read("tests/integration/wp12/application.tsx");
const application = ts.createSourceFile(
  "application.tsx",
  app,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
function inspectApplication(node) {
  assert(
    !ts.isAsExpression(node) && !ts.isTypeAssertionExpression(node),
    "No fixture casts",
  );
  assert(
    !(ts.isJsxAttribute(node) && node.name.getText(application) === "key"),
    "No live owner rekey",
  );
  ts.forEachChild(node, inspectApplication);
}
inspectApplication(application);
assert(
  app.includes("owner.reorder?.commit(model)") &&
    app.includes("owner.reorder?.onSubmit(operation)"),
);
for (const path of leased) await read(path);
console.log(
  `${entries.length} exact PUBLIC emitted mappings; ${seen.size} application source modules; real six-flow assertions, strict6574 and three-engine config. Syntax/static scope only, no runtime compatibility claim.`,
);
