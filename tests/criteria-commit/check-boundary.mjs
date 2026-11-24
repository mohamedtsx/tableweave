import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";

const source = new URL(
  "../../packages/heroui/src/filters/criteria-commit.tsx",
  import.meta.url,
);
const text = await readFile(source, "utf8");
const parsed = ts.createSourceFile(
  source.pathname,
  text,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
assert.equal(parsed.parseDiagnostics.length, 0, "Cell syntax");
const compiled = ts.transpileModule(text, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX,
    verbatimModuleSyntax: true,
  },
  reportDiagnostics: true,
  fileName: source.pathname,
});
assert.equal(compiled.diagnostics?.length ?? 0, 0);
const emitted = ts.createSourceFile(
  "cell.js",
  compiled.outputText,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
const imports = emitted.statements
  .filter(ts.isImportDeclaration)
  .map((node) => node.moduleSpecifier.text);
assert.deepEqual(imports, ["@tableweave/react", "./criteria-ports.js"]);
assert(
  !/from\s+["'](?:\.\.\/)+react\//.test(text),
  "No cross-package relative source dependency",
);
assert(
  !/\b(?:useState|useEffect|useLayoutEffect|useSyncExternalStore)\s*\(/.test(
    text,
  ),
  "Core cell has no React hook ownership",
);
assert(
  !/\.(?:dispose|dispatch|accept|reject|begin|complete|setContext)\s*\(/.test(
    text,
  ),
  "No controller/application/source retirement commands",
);
let ownSyntax = 0;
for (const file of await readdir(new URL("./", import.meta.url))) {
  if (!/\.(?:ts|tsx)$/.test(file)) continue;
  const contents = await readFile(new URL(file, import.meta.url), "utf8");
  const node = ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  assert.equal(node.parseDiagnostics.length, 0, file);
  ownSyntax++;
}
console.log(
  JSON.stringify({
    mode: "static in-memory syntax/transpile inspection only",
    runtimeImports: imports,
    ownTypeScriptFilesParsed: ownSyntax,
    emittedFilesWritten: 0,
  }),
);
