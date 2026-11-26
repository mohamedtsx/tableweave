import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { sourceTypePaths } from "../controls/harness/resolve.mjs";
import { hash, own, ownedInputs, requireProtected, root, source } from "./protect.mjs";

const label = process.argv[2];
assert(/^[a-z][a-z0-9-]*$/.test(label));
const output = join(own, ".artifacts", label);
await mkdir(output, { recursive: false });
const ts = createRequire(join(root, "package.json"))("typescript");
const protectedBefore = await requireProtected();
const graph = {};
async function runtimeGraph(path) {
  if (Object.hasOwn(graph, path)) return;
  const text = await readFile(join(root, path), "utf8");
  const node = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  graph[path] = [];
  for (const statement of node.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
    if (statement.isTypeOnly || statement.importClause?.isTypeOnly || !statement.moduleSpecifier) continue;
    const specifier = statement.moduleSpecifier.text;
    assert(specifier.startsWith("."), `Unexpected runtime package import: ${path} -> ${specifier}`);
    const target = resolve(root, dirname(path), specifier).slice(root.length + 1).replace(/\.js$/, ".ts");
    assert(target.startsWith("packages/heroui/src/"));
    assert(!target.endsWith(".tsx"));
    graph[path].push(target);
    await runtimeGraph(target);
  }
  function noEagerFormatter(current) {
    if (ts.isFunctionLike(current)) return;
    if (ts.isNewExpression(current)) assert(!current.expression.getText(node).startsWith("Intl."), `Eager formatter: ${path}`);
    ts.forEachChild(current, noEagerFormatter);
  }
  ts.forEachChild(node, noEagerFormatter);
}
await runtimeGraph(`${source}index.ts`);
const config = ts.readConfigFile(join(root, "tsconfig.base.json"), ts.sys.readFile);
assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const paths = sourceTypePaths();
const files = [
  join(root, source, "index.ts"),
  join(own, "types.ts"),
  join(own, "defaults.ts"),
  join(own, "locales.test.ts"),
];
const options = {
  ...parsed.options, noEmit: true, skipLibCheck: false,
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX, types: ["node"],
  lib: ["lib.es2022.d.ts", "lib.es2023.d.ts", "lib.es2023.intl.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  paths,
};
const program = ts.createProgram({ rootNames: files, options });
const errors = ts.getPreEmitDiagnostics(program).map((d) => ({
  code: d.code, path: d.file?.fileName,
  line: d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0,
  message: ts.flattenDiagnosticMessageText(d.messageText, " "),
}));
const owned = await ownedInputs();
await requireProtected();
const result = {
  provisional: true, compiler: ts.version, sourceNoEmitOnly: true, errors,
  protectedInputs: Object.keys(protectedBefore).length,
  protectedAggregate: hash(JSON.stringify(protectedBefore)),
  runtimeGraph: graph, runtimeModules: Object.keys(graph).length,
  staticOnly: true, noRuntimePackageImports: true, noEagerIntlConstructionInStaticGraph: true,
  owned, ownedAggregate: hash(JSON.stringify(owned)),
  deferred: ["runtime unit replay", "removed-directive proof", "TS5.9", "private emitted consumers", "Biome", "RTL/browser/Storybook", "native-language manual review"],
};
await writeFile(join(output, "result.json"), JSON.stringify(result, null, 2));
console.log(`TS${ts.version}: ${errors.length} source errors; static ${Object.keys(graph).length}-module data graph; protected ${Object.keys(protectedBefore).length} unchanged. Provisional.`);
assert.deepEqual(errors, [], "Light source errors retained; no full verification performed");
