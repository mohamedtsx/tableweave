import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../../../", import.meta.url);
const capturePath = "packages/react/src/reordering/capture.ts";
const admissionPath = "packages/react/src/reordering-controller/admission.ts";
const typesPath = "packages/react/src/reordering/types.ts";
const leased = [typesPath, capturePath, admissionPath];
const text = (path) => readFile(new URL(path, root), "utf8");
const preimage = (path) =>
  readFile(
    new URL(`./preimages/${path.replaceAll("/", "__")}.txt`, import.meta.url),
    "utf8",
  );
function parse(path, source) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  assert.equal(file.parseDiagnostics.length, 0, path);
  return file;
}
const imports = (file) =>
  file.statements
    .filter(ts.isImportDeclaration)
    .map((node) => node.getText(file));
for (const path of leased) {
  const before = parse(path, await preimage(path));
  const after = parse(path, await text(path));
  assert.deepEqual(imports(after), imports(before), `No import delta: ${path}`);
  if (path === capturePath) {
    assert.equal(before.statements.length, after.statements.length);
    before.statements.forEach((node, index) => {
      const current = after.statements[index];
      if (
        ts.isFunctionDeclaration(node) &&
        ["stamp", "frame", "sameOrigin"].includes(node.name?.text)
      )
        return;
      assert.equal(
        current.getText(after),
        node.getText(before),
        `Frozen capture declaration ${index}`,
      );
    });
  }
  if (path === typesPath) {
    assert.equal(before.statements.length, after.statements.length);
    before.statements.forEach((node, index) => {
      const current = after.statements[index];
      if (
        ts.isInterfaceDeclaration(node) &&
        node.name.text === "ReorderStamp"
      ) {
        assert(ts.isInterfaceDeclaration(current));
        assert.equal(current.members.length, node.members.length + 1);
        assert.deepEqual(
          current.members.slice(0, -1).map((member) => member.getText(after)),
          node.members.map((member) => member.getText(before)),
        );
        assert.equal(
          current.members.at(-1).getText(after),
          'readonly extent?: "page" | "complete";',
        );
      } else
        assert.equal(
          current.getText(after),
          node.getText(before),
          `Frozen type declaration ${index}`,
        );
    });
  }
}
const policy = `    const complete =
      definition.native.controllerDefinition.schema.pagination.enabled ===
      false;
    if (
      definition.native.paginationEnabled !== !complete ||
      value.view.pagination.enabled !== !complete
    )
      return deny();
`;
const marker = '        ...(complete ? { extent: "complete" } : {}),\n';
const admission = await text(admissionPath);
assert(admission.includes(policy));
assert(admission.includes(marker));
assert.equal(
  admission.replace(policy, "").replace(marker, ""),
  await preimage(admissionPath),
  "Admission changes only the selected readFrame policy/marker, no lifetime/receipt fix",
);
assert.equal((admission.match(/createRowMoveCoordinator\(/g) ?? []).length, 1);

const entryPath = "packages/react/src/reordering/index.ts";
const entry = parse(entryPath, await text(entryPath));
let values = 0,
  types = 0;
for (const node of entry.statements) {
  assert(
    ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause),
  );
  if (node.isTypeOnly) types += node.exportClause.elements.length;
  else values += node.exportClause.elements.length;
}
assert.equal(values, 4);
assert.equal(types, 20);
const graph = new Set();
async function visit(path) {
  if (graph.has(path)) return;
  graph.add(path);
  const file = parse(path, await text(path));
  for (const node of file.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
      continue;
    const specifier = node.moduleSpecifier?.text;
    if (!specifier) continue;
    assert(specifier.startsWith(".") && specifier.endsWith(".js"), specifier);
    const next = new URL(
      specifier.replace(/\.js$/, ".ts"),
      new URL(path, root),
    );
    const relative = next.href.slice(root.href.length);
    assert(relative.startsWith("packages/react/src/reordering/"), relative);
    await visit(relative);
  }
}
await visit(entryPath);
assert.equal(graph.size, 5);
console.log(
  "Static AST/source delta: only stamp/frame/sameOrigin, one optional ReorderStamp property and the exact authenticated readFrame extent policy/marker; pure five-file graph stays local; unchanged entry has 4 values/20 types. No module execution, cycle/runtime/packed proof.",
);
