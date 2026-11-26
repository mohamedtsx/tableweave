import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import ts from "typescript";

const own = "tests/reordering/native-lifetime";
const core = "packages/heroui/src/filters/criteria-commit-core.ts";
const renderer = "packages/heroui/src/table/renderer-commit.ts";
const native = "packages/heroui/src/table/native-resource-lifetime.ts";
const files = [
  core,
  renderer,
  native,
  ...(await readdir(own))
    .filter((name) => /\.(ts|tsx|mjs)$/.test(name))
    .map((name) => `${own}/${name}`),
];
function parse(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  assert.equal(source.parseDiagnostics.length, 0, `Syntax: ${file}`);
  return source;
}
function visit(node, fn) {
  fn(node);
  ts.forEachChild(node, (child) => visit(child, fn));
}
const sources = new Map();
for (const file of files)
  sources.set(file, parse(file, await readFile(file, "utf8")));
function ownKeys(source) {
  let keys;
  visit(source, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === "cell" &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      keys = node.initializer.properties.map((property) =>
        property.name.getText(source),
      );
    }
  });
  return keys;
}
const before = parse(
  core,
  await readFile(`${own}/.artifacts/criteria-commit-core.ts.preimage`, "utf8"),
);
assert.deepEqual(ownKeys(sources.get(core)), ownKeys(before));
function adapterKeys(source) {
  let keys;
  visit(source, (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === "CommitAdapter")
      keys = node.members.map((member) => member.name.getText(source));
  });
  return keys;
}
assert.deepEqual(adapterKeys(sources.get(core)), adapterKeys(before));
for (const source of [
  sources.get(core),
  sources.get(renderer),
  sources.get(native),
]) {
  visit(source, (node) => {
    if (!ts.isCallExpression(node)) return;
    if (
      !new Set([
        "installRendererNativeLifetime",
        "claimRendererNativeInstall",
        "createRendererCommitCore",
        "createCore",
      ]).has(node.expression.getText(source))
    )
      return;
    let owner = node.parent;
    while (owner && !ts.isFunctionLike(owner)) owner = owner.parent;
    assert.ok(owner, "Construction/claim cannot run at module top level");
  });
}
const forbidden = new Set([
  "addEventListener",
  "removeEventListener",
  "MutationObserver",
  "ResizeObserver",
  "setTimeout",
  "requestAnimationFrame",
  "getBoundingClientRect",
  "querySelector",
  "closest",
  "cloneNode",
  "appendChild",
  "insertBefore",
  "setAttribute",
  "dispose",
]);
visit(sources.get(native), (node) => {
  if (ts.isIdentifier(node))
    assert.ok(
      !forbidden.has(node.text),
      `Unexpected native resource ${node.text}`,
    );
});
let specialization = 0;
visit(sources.get(core), (node) => {
  if (!ts.isCallExpression(node) || node.expression.getText() !== "createCore")
    return;
  if (node.arguments.length === 2) {
    assert.equal(node.arguments[1].kind, ts.SyntaxKind.TrueKeyword);
    let owner = node.parent;
    while (owner && !ts.isFunctionDeclaration(owner)) owner = owner.parent;
    assert.equal(owner?.name?.text, "createRendererCommitCore");
    specialization++;
  }
});
assert.equal(specialization, 1);
const config = ts.readConfigFile(`${own}/tsconfig.light.json`, ts.sys.readFile);
assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, own);
assert.equal(parsed.errors.length, 0);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const inputFiles = program
  .getSourceFiles()
  .map((file) => file.fileName)
  .filter((file) => !file.includes("node_modules"));
const configs = [
  "tsconfig.base.json",
  `${own}/tsconfig.light.json`,
  "tests/data-table/details-accessory/tsconfig.light.json",
  "pnpm-lock.yaml",
];
const inputs = {};
for (const file of [...new Set([...inputFiles, ...configs])].sort()) {
  const name = file.startsWith(`${process.cwd()}/`)
    ? file.slice(process.cwd().length + 1)
    : file;
  inputs[name] = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
}
if (process.argv[2] === "pin") {
  await writeFile(
    `${own}/.artifacts/positive-inputs.json`,
    `${JSON.stringify(inputs, null, 2)}\n`,
    { flag: "wx" },
  );
} else if (process.argv[2] === "stable") {
  assert.deepEqual(
    inputs,
    JSON.parse(
      await readFile(`${own}/.artifacts/positive-inputs.json`, "utf8"),
    ),
  );
}
console.log(
  JSON.stringify({
    syntaxFiles: files.length,
    ownKeys: "unchanged AST",
    specialization,
    nativeResources: "refs only",
    positiveInputs: Object.keys(inputs).length,
    typescript: ts.version,
  }),
);
