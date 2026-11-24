import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("./.artifacts/declarations/", import.meta.url);
const pending = [new URL("index.d.ts", root)];
const seen = new Set();
while (pending.length) {
  const file = pending.pop();
  if (seen.has(file.href)) continue;
  seen.add(file.href);
  assert(file.href.startsWith(root.href));
  const source = ts.createSourceFile(
    file.pathname,
    await readFile(file, "utf8"),
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
        !/^(@heroui\/|react-aria|@internationalized\/)/.test(specifier),
        `Vendor declaration leak: ${specifier}`,
      );
      if (specifier.startsWith("."))
        pending.push(new URL(specifier.replace(/\.js$/, ".d.ts"), file));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
console.log(
  `Scoped own declaration graph: ${seen.size} files; no HeroUI/Aria/date prop types. Not tarball proof.`,
);
