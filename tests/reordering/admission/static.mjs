import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../../../", import.meta.url);
const directory = new URL(
  "../../../packages/react/src/reordering-controller/",
  import.meta.url,
);
let constructors = 0,
  factories = 0;
for (const name of await readdir(directory)) {
  assert(
    ["admission.ts", "controller.ts", "types.ts", "index.ts"].includes(name),
  );
  const source = await readFile(new URL(name, directory), "utf8");
  const file = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true);
  assert.equal(file.parseDiagnostics.length, 0, name);
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const path = node.moduleSpecifier?.text;
      if (path) {
        assert(!/@dnd-kit|@heroui|\.repo|\/sortable/.test(path));
        assert(path.startsWith("."), path);
      }
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(file);
      if (callee === "createRowMoveCoordinator") constructors++;
      if (callee === "definition.createController") factories++;
      assert(
        !/createTableController|createNativeController|createCriteriaPublication|setOptions|setRowSelection/.test(
          callee,
        ),
        callee,
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
}
assert.equal(constructors, 1);
assert.equal(factories, 1);
const entry = await readFile(new URL("index.ts", directory), "utf8");
assert(entry.startsWith('"use client";'));
for (const path of [
  "packages/react/src/index.ts",
  "packages/react/src/contracts/index.ts",
  "packages/react/src/criteria/index.ts",
  "packages/react/src/reordering/index.ts",
]) {
  assert(
    !(await readFile(new URL(path, root), "utf8")).includes(
      "reordering-controller",
    ),
    path,
  );
}
console.log(
  "Four new modules parsed; exactly one actual D factory call and one actual pure coordinator; no public-root/contracts/criteria/pure entry import of new helper; no UI/DnD/fake-factory imports. Static source check only; no runtime/cycle/packed claim.",
);
