import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";

/** Extract only the named data initializer, never import/evaluate a UI module.
 * Reference source is local trusted producer code. Dependencies are explicit data
 * dictionaries; no hook, editor, app formatter or controller callback is supplied.
 */
export function readDefault(
  root: string,
  path: string,
  name: string,
  bindings: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  const text = readFileSync(resolve(root, path), "utf8");
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  let initializer: ts.Expression | undefined;
  function visit(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name)
      initializer = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert(initializer, `${path}: ${name}`);
  const script = ts.transpileModule(`result = (${initializer.getText(source)});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const sandbox: Record<string, unknown> = { ...bindings, Intl, Date };
  runInNewContext(script, sandbox, { timeout: 1000 });
  const result = sandbox.result;
  assert(result && typeof result === "object");
  return result as Readonly<Record<string, unknown>>;
}
