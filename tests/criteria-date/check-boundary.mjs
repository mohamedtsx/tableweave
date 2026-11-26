import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const paths = [
  "toolbar/filter-date.tsx",
  "toolbar/criteria-tool-host.tsx",
  "date/date-types.ts",
  "date/date-operand-editor.tsx",
  "date/date-picker.tsx",
  "date/date-instant.tsx",
  "date/date-segments.tsx",
  "date/criteria-date-state.tsx",
].map((path) => `packages/heroui/src/${path}`);
let syntax = 0;
for (const path of [
  ...paths,
  ...(await readdir(new URL("./", import.meta.url)))
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => `tests/criteria-date/${name}`),
]) {
  const text = await readFile(new URL(path, root), "utf8"),
    file = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
  assert.equal(file.parseDiagnostics.length, 0, path);
  syntax++;
  if (!paths.includes(path)) continue;
  for (const item of file.statements.filter(ts.isImportDeclaration)) {
    const name = item.moduleSpecifier.text;
    assert(
      !/\.repo|\/dist\/|(?:\.\.\/)+react\/src/.test(name),
      `${path}: source/vendor import fence`,
    );
  }
  if (path.endsWith("filter-date.tsx")) {
    const wrapper = file.statements.find(
      (node) =>
        ts.isFunctionDeclaration(node) && node.name?.text === "FilterDate",
    );
    assert(wrapper?.body);
    assert.equal(wrapper.body.statements.length, 1);
    assert(!/props\./.test(wrapper.body.getText(file)));
    const adopted = text.slice(text.indexOf("interface DateFocus"));
    assert(
      !/\b(?:useState|setTimeout|requestAnimationFrame)\s*\(/.test(adopted),
    );
    assert(!/\.(?:dispose|connect|setContext)\s*\(/.test(adopted));
  }
  for (const item of file.statements.filter(ts.isFunctionDeclaration)) {
    if (
      !item.name?.text.startsWith("Criteria") ||
      !item.body ||
      item.name.text === "CriteriaToolHost"
    )
      continue;
    assert(
      !/\buseState\s*\(/.test(item.body.getText(file)),
      `${path}: adopted surface private state is F3 owned`,
    );
    assert(
      !/\.current\s*=/.test(item.body.getText(file)),
      `${path}: no latest private ref publication`,
    );
  }
}
console.log(
  `${syntax} TS/TSX files parsed; source import/adopted-state fences inspected; 0 emitted files; no application modules loaded.`,
);
