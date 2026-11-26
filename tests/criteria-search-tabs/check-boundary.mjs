import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const sourceNames = [
  "filter-shared.ts",
  "filter-search.tsx",
  "filter-tabs.tsx",
  "criteria-tool-host.tsx",
];
const result = {};
for (const name of sourceNames) {
  const path = `packages/heroui/src/toolbar/${name}`,
    text = await readFile(new URL(path, root), "utf8");
  const parsed = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  assert.equal(parsed.parseDiagnostics.length, 0, name);
  const transpiled = ts.transpileModule(text, {
    fileName: name,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      verbatimModuleSyntax: true,
    },
  });
  assert.equal(transpiled.diagnostics?.length ?? 0, 0, name);
  const js = ts.createSourceFile(
    "module.js",
    transpiled.outputText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const imports = js.statements
    .filter(ts.isImportDeclaration)
    .map((node) => node.moduleSpecifier.text);
  assert(
    !imports.some((specifier) =>
      /(?:^|\/)\.\.\/.*packages\/react|\.\.\/\.\.\/react\//.test(specifier),
    ),
    name,
  );
  result[name] = imports;
  if (name === "filter-shared.ts")
    assert(
      !imports.includes("../filters/criteria-commit.js"),
      "Shared optional target is type-only",
    );
  if (name === "filter-search.tsx" || name === "filter-tabs.tsx") {
    const component =
      name === "filter-search.tsx" ? "FilterSearch" : "FilterTabs";
    const wrapper = parsed.statements.find(
      (node) => ts.isFunctionDeclaration(node) && node.name?.text === component,
    );
    assert(wrapper?.body);
    assert.equal(wrapper.body.statements.length, 1);
    assert(
      !/props\.(?:messages|controller|children|tabs|onMutation|className)/.test(
        wrapper.body.getText(parsed),
      ),
      "No private wrapper reads before discriminant",
    );
    const marker =
      name === "filter-search.tsx"
        ? "interface CriteriaSearchDraft"
        : "export interface CriteriaTabsLocal";
    const adopted = text.slice(text.indexOf(marker));
    assert(text.includes(marker));
    assert(
      !/\b(?:useState|setTimeout|clearTimeout|requestAnimationFrame)\s*\(/.test(
        adopted,
      ),
      "Adopted private state/work uses F3 only",
    );
    assert(
      !/\.current\s*=/.test(adopted),
      "No render/latest-ref publication in adopted surface",
    );
    assert(
      !/\.(?:dispose|begin|complete|setContext|connect)\s*\(/.test(adopted),
      "No app/source lifetime acquisition in surfaces",
    );
  }
}
let count = 0;
for (const name of await readdir(new URL("./", import.meta.url))) {
  if (!/\.(ts|tsx)$/.test(name)) continue;
  const text = await readFile(new URL(name, import.meta.url), "utf8");
  const parsed = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  assert.equal(parsed.parseDiagnostics.length, 0, name);
  count++;
}
console.log(
  JSON.stringify({
    mode: "in-memory syntax/erasure/import inspection only",
    productionImports: result,
    ownTypeScriptSyntaxFiles: count,
    emittedFilesWritten: 0,
  }),
);
