import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { expect, it } from "vitest";

it("actual source graph has no cycle returning into the new client helper", async () => {
  const root = new URL("../../../packages/react/src/", import.meta.url);
  const seen = new Set<string>();
  const active: string[] = [];
  const cycles: string[][] = [];
  async function visit(url: URL): Promise<void> {
    const path = fileURLToPath(url);
    const ancestor = active.indexOf(path);
    if (ancestor >= 0) {
      const cycle = [...active.slice(ancestor), path];
      if (cycle.some((item) => item.includes("/reordering-controller/")))
        cycles.push(cycle);
      return;
    }
    if (seen.has(path)) return;
    seen.add(path);
    active.push(path);
    const file = ts.createSourceFile(
      path,
      await readFile(url, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const node of file.statements) {
      if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
        continue;
      if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier))
        continue;
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith(".") && specifier.endsWith(".js"))
        await visit(new URL(specifier.replace(/\.js$/, ".ts"), url));
    }
    active.pop();
  }
  await visit(new URL("reordering-controller/index.ts", root));
  expect(cycles).toEqual([]);
});
