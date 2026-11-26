import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const here = fileURLToPath(new URL("./", import.meta.url));
const baseline = JSON.parse(await readFile(here + "baseline.json", "utf8"));
const sha = (input) => createHash("sha256").update(input).digest("hex");
const parse = (name, text) =>
  ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
const printer = ts.createPrinter({ removeComments: true });
const print = (node) =>
  printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
async function preimage(path) {
  return parse(path, await readFile(here + "preimages/" + path, "utf8"));
}
async function actual(path) {
  return parse(path, await readFile(root + path, "utf8"));
}
const corePath = baseline.existing[0],
  oldCore = await preimage(corePath),
  core = await actual(corePath);
const keep = (node) =>
  !(
    ts.isImportDeclaration(node) &&
    node.moduleSpecifier.text.startsWith("../details/")
  ) &&
  !(
    ts.isFunctionDeclaration(node) &&
    node.name?.text === "createDetailsCommitCore"
  );
assert.deepEqual(
  core.statements.filter(keep).map(print),
  oldCore.statements.map(print),
  "Existing core engine/tool/renderer changed",
);
const hookPath = "packages/heroui/src/details/use-details-session.ts",
  oldHook = await preimage(hookPath),
  hook = await actual(hookPath);
const fn = (file, name) =>
  file.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
function omitRequest(node) {
  return ts.factory.updateFunctionDeclaration(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.typeParameters,
    node.parameters,
    node.type,
    ts.factory.updateBlock(
      node.body,
      node.body.statements.filter(
        (statement) =>
          !(
            ts.isVariableStatement(statement) &&
            statement.declarationList.declarations.some(
              (d) => d.name.getText() === "request",
            )
          ),
      ),
    ),
  );
}
assert.equal(
  print(omitRequest(fn(hook, "useDetailsSession"))),
  print(omitRequest(fn(oldHook, "useDetailsSession"))),
  "Raw hook changed outside the shared request extraction",
);
const shellPath = "packages/heroui/src/details/details-shell.tsx",
  oldShell = await preimage(shellPath),
  shell = await actual(shellPath);
for (const name of ["Interior", "DetailsTrigger"])
  assert.equal(
    print(fn(shell, name)),
    print(fn(oldShell, name)),
    `Raw ${name} changed`,
  );
assert.equal(
  sha(await readFile(here + "source126-before.json")),
  baseline.source126,
  "Copied main map changed",
);
let checked = 0;
const inputs = [...baseline.existing, ...baseline.additions];
for (const entry of await readdir(here, { withFileTypes: true }))
  if (entry.isFile() && /\.(?:ts|tsx|mjs)$/.test(entry.name))
    inputs.push("tests/data-table/details-accessory/" + entry.name);
for (const path of inputs) {
  const text = await readFile(root + path, "utf8"),
    file = parse(path, text);
  assert.equal(file.parseDiagnostics.length, 0, `Syntax: ${path}`);
  // Resolve only direct local imports, without evaluating runtime modules/cycles.
  for (const node of file.statements)
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier.text.startsWith(".")
    ) {
      const specifier = node.moduleSpecifier.text;
      const candidates = /\.js$/.test(specifier)
        ? [
            specifier.replace(/\.js$/, ".ts"),
            specifier.replace(/\.js$/, ".tsx"),
            specifier,
          ]
        : [specifier];
      let found = false;
      for (const candidate of candidates)
        try {
          await access(new URL(candidate, new URL(path, `file://${root}`)));
          found = true;
          break;
        } catch {}
      assert.ok(found, `Unresolved local import ${path}: ${specifier}`);
    }
  checked++;
}
const report = {
  scope: "static AST/import/syntax only",
  existingCoreNormalized: sha(oldCore.statements.map(print).join("\n")),
  rawHookOutsideRequest: "AST equal",
  rawInteriorAndTrigger: "AST equal",
  checked,
  limits: [
    "No runtime/cycle/SSR/React/browser/negative or emitted proof",
    "Shared request policy/transition behavior still requires old raw regressions and new bound tests",
  ],
};
await mkdir(here + ".artifacts", { recursive: true });
await writeFile(
  here + ".artifacts/static.json",
  JSON.stringify(report, null, 2) + "\n",
);
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
