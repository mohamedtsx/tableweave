import assert from "node:assert/strict";
import { readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import ts from "typescript";

export async function plainGraph(entry, directory, source = true) {
  const root = await realpath(directory),
    nodes = new Map(),
    edges = [],
    typeEdges = [];
  async function visit(input) {
    const file = await realpath(input),
      path = relative(root, file);
    assert(
      path && !isAbsolute(path) && path !== ".." && !path.startsWith("../"),
      `Module leaves root: ${path}`,
    );
    if (nodes.has(file)) return;
    const text = await readFile(file, "utf8");
    const ast = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      source ? ts.ScriptKind.TS : ts.ScriptKind.JS,
    );
    assert.equal(ast.parseDiagnostics.length, 0, `Syntax: ${path}`);
    nodes.set(file, { path, text, ast });
    function noDynamic(node) {
      if (ts.isIdentifier(node))
        assert(
          ![
            "window",
            "document",
            "navigator",
            "localStorage",
            "sessionStorage",
            "fetch",
            "WebSocket",
            "XMLHttpRequest",
            "globalThis",
            "process",
          ].includes(node.text),
          `Framework/DOM/network/global entry dependency: ${path}`,
        );
      if (ts.isCallExpression(node))
        assert(
          node.expression.kind !== ts.SyntaxKind.ImportKeyword &&
            !(
              ts.isIdentifier(node.expression) &&
              ["require", "eval"].includes(node.expression.text)
            ),
          `Dynamic runtime loader: ${path}`,
        );
      ts.forEachChild(node, noDynamic);
    }
    noDynamic(ast);
    for (const node of ast.statements) {
      if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression))
        assert.notEqual(
          node.expression.text,
          "use client",
          `Client directive: ${path}`,
        );
      if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
        continue;
      if (!node.moduleSpecifier) continue;
      assert(
        ts.isStringLiteral(node.moduleSpecifier),
        `Nonliteral module: ${path}`,
      );
      const name = node.moduleSpecifier.text;
      const onlyTypes =
        node.isTypeOnly ||
        node.importClause?.isTypeOnly ||
        (node.importClause &&
          !node.importClause.name &&
          ts.isNamedImports(node.importClause.namedBindings) &&
          node.importClause.namedBindings.elements.every(
            (value) => value.isTypeOnly,
          )) ||
        (node.exportClause &&
          ts.isNamedExports(node.exportClause) &&
          node.exportClause.elements.every((value) => value.isTypeOnly));
      if (onlyTypes) {
        typeEdges.push({ from: path, specifier: name, erased: true });
        continue;
      }
      assert(
        name.startsWith("."),
        `External runtime dependency ${name}: ${path}`,
      );
      assert(
        name.endsWith(".js"),
        `Unexpected runtime extension ${name}: ${path}`,
      );
      const target = resolve(
        dirname(file),
        source ? name.replace(/\.js$/, ".ts") : name,
      );
      edges.push({ from: path, to: relative(root, target) });
      await visit(target);
    }
  }
  await visit(entry);
  return { root, nodes, edges, typeEdges };
}

export function explicitEntryExports(ast) {
  const runtime = [],
    types = [];
  for (const node of ast.statements) {
    assert(
      ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause),
      "Entry must contain only explicit named reexports",
    );
    for (const item of node.exportClause.elements) {
      assert(!item.propertyName, "Unexpected alias in criteria entry");
      (node.isTypeOnly || item.isTypeOnly ? types : runtime).push(
        item.name.text,
      );
    }
  }
  return { runtime: runtime.sort(), types: types.sort() };
}
