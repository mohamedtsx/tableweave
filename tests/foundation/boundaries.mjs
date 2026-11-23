import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import ts from "typescript";

// Inspect emitted modules, not just direct source imports or workspace aliases.
export async function inspectGraph(entry, root) {
  const declarations = entry.endsWith(".d.ts");
  const visited = new Set();
  const externals = new Set();
  const directives = new Map();
  const pending = [resolve(entry)];
  const boundary = resolve(root);

  while (pending.length > 0) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    if (!file.startsWith(`${boundary}${sep}`))
      throw new Error(`Escaped package: ${file}`);
    visited.add(file);
    const text = await readFile(file, "utf8");
    const source = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
    );
    const client = source.statements.some(
      (node) =>
        ts.isExpressionStatement(node) &&
        ts.isStringLiteral(node.expression) &&
        node.expression.text === "use client",
    );
    directives.set(file, client);
    function visit(node) {
      let specifier;
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        specifier = node.moduleSpecifier.text;
      } else if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      ) {
        specifier = node.argument.literal.text;
      } else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require"))
      ) {
        const arg = node.arguments[0];
        if (!arg || !ts.isStringLiteral(arg))
          throw new Error(`Uninspectable import in ${file}`);
        specifier = arg.text;
      }
      if (specifier) {
        if (specifier.startsWith("."))
          pending.push(
            resolve(
              file,
              "..",
              declarations ? specifier.replace(/\.js$/, ".d.ts") : specifier,
            ),
          );
        else externals.add(specifier);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return { files: [...visited], externals: [...externals], directives };
}

export function forbiddenImports(graph, forbidden) {
  return graph.externals.filter((specifier) =>
    forbidden.some(
      (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
    ),
  );
}
