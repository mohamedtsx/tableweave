import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url)),
  own = "tests/criteria-facade-config/",
  out = `${root}${own}.artifacts/resumed/`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex"),
  json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const baseline = JSON.parse(await readFile(`${out}baseline.json`, "utf8"));
assert.equal(
  sha(await readFile(`${out}source133-before.json`)),
  baseline.source133,
);
assert.equal(
  sha(await readFile(`${out}stopped-README.md`)),
  baseline.stoppedREADME,
);
const before = JSON.parse(await readFile(`${out}protected-files.json`, "utf8")),
  sources = JSON.parse(
    await readFile(`${out}protected-sources130.json`, "utf8"),
  );
async function actual(path) {
  try {
    return {
      mode: (await stat(root + path)).mode.toString(8),
      sha256: sha(await readFile(root + path)),
    };
  } catch {
    return null;
  }
}
const changed = [];
for (const [path, value] of Object.entries(before))
  if (JSON.stringify(await actual(path)) !== JSON.stringify(value))
    changed.push(path);
const changedSource = [];
for (const [path, value] of Object.entries(sources))
  if (JSON.stringify(await actual(path)) !== JSON.stringify(value))
    changedSource.push(path);
assert.deepEqual(changedSource, [], "Protected package source changed");
// Observed main-owned planning updates after the server restart. These are NOT
// a replacement baseline or authorization to edit/restore those files.
const external = [
  "REVIEW.md",
  "TASKS.md",
  "docs/planning/wp-09-builder-adoption-plan.md",
  "docs/planning/wp-09-criteria-entry-plan.md",
  "docs/planning/wp-09-implementation-plan.md",
];
assert.deepEqual(
  changed.filter((path) => !external.includes(path)),
  [],
  "Unexpected old file/seal drift",
);
const newPlanning = [
  "docs/planning/wp-09-builder-format-plan.md",
  "docs/planning/wp-09-data-table-shell-plan.md",
  "docs/planning/wp-09-details-neutral-label-plan.md",
  "docs/planning/wp-09-shell-layout-css-plan.md",
];
async function paths(dir = "") {
  const result = [];
  for (const entry of await readdir(root + dir, { withFileTypes: true })) {
    if ([".git", ".repo", "node_modules"].includes(entry.name)) continue;
    const path = dir + entry.name;
    if (`${path}/` === own) continue;
    if (entry.isDirectory()) result.push(...(await paths(`${path}/`)));
    else if (entry.isFile()) result.push(path);
    else assert.fail(`Unexpected entry ${path}`);
  }
  return result;
}
const extras = (await paths()).filter(
  (path) =>
    !Object.hasOwn(before, path) &&
    !baseline.existing.includes(path) &&
    path !== baseline.addition,
);
assert.deepEqual(
  extras.filter((path) => !newPlanning.includes(path)),
  [],
  "Unexpected new file outside worker scope",
);
const provenance = [];
for (const path of [...changed, ...newPlanning])
  provenance.push({
    path,
    before: before[path] ?? null,
    after: await actual(path),
    classification: "observed external main planning; no rebase/no worker edit",
  });
const parse = (path, text) =>
  ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
const printer = ts.createPrinter({ removeComments: true }),
  print = (node) =>
    printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
const corePath = "packages/heroui/src/filters/criteria-commit-core.ts",
  core = parse(corePath, await readFile(root + corePath, "utf8")),
  old = parse(corePath, await readFile(`${out}preimages/${corePath}`, "utf8"));
function fn(file, name) {
  return file.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
}
for (const name of [
  "createToolCommitCore",
  "createRendererCommitCore",
  "createDetailsCommitCore",
])
  assert.equal(
    print(fn(core, name)),
    print(fn(old, name)),
    `${name} signature/body changed`,
  );
function cell(file) {
  let found;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText() === "cell" &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    )
      found = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(fn(file, "createCore"));
  return print(found);
}
assert.equal(cell(core), cell(old), "Core cell own keys/operations changed");
assert.equal(
  core.statements.filter(
    (node) =>
      ts.isFunctionDeclaration(node) && node.name?.text === "createCore",
  ).length,
  1,
  "Duplicate lifecycle engine",
);
const inputs = [...baseline.existing, baseline.addition];
for (const entry of await readdir(root + own, { withFileTypes: true }))
  if (
    entry.isFile() &&
    /\.(?:tsx?|mjs)$/.test(entry.name) &&
    !["scope.mjs", "resumed-scope.mjs"].includes(entry.name)
  )
    inputs.push(own + entry.name);
for (const path of inputs) {
  const file = parse(path, await readFile(root + path, "utf8"));
  assert.equal(file.parseDiagnostics.length, 0, `Syntax: ${path}`);
  for (const node of file.statements)
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier.text.startsWith(".")
    ) {
      const spec = node.moduleSpecifier.text,
        candidates = spec.endsWith(".js")
          ? [spec.replace(/\.js$/, ".ts"), spec.replace(/\.js$/, ".tsx"), spec]
          : [spec];
      let found = false;
      for (const candidate of candidates)
        try {
          await access(new URL(candidate, new URL(path, `file://${root}`)));
          found = true;
          break;
        } catch {}
      assert.ok(found, `Import ${path}: ${spec}`);
    }
}
const result = {
  scope: "static metadata/syntax/import/identity only",
  protectedSources: 130,
  protectedSourceChanges: changedSource,
  oldFiles: Object.keys(before).length,
  unchangedOldFiles: Object.keys(before).length - changed.length,
  externalMetadataChanges: provenance,
  constructorsAndCoreOwnKeys: "AST equal",
  syntaxInputs: inputs.length,
  limits: [
    "External planning drift remains recorded against the original baseline",
    "No runtime/React/browser/SSR/cycle/negative/emitted or independent approval",
  ],
};
await writeFile(`${out}verification.json`, json(result));
process.stdout.write(json(result));
