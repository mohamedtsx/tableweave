import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("../../", import.meta.url),
  source = "packages/heroui/src/date/criteria-date-state.tsx";
const text = await readFile(new URL(source, root), "utf8"),
  before = await readFile(
    new URL("./source-preimage.txt", import.meta.url),
    "utf8",
  );
const parse = (name, text) => {
  const file = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  assert.equal(file.parseDiagnostics.length, 0, name);
  return file;
};
const current = parse(source, text),
  original = parse(source, before);
const countSlots = (file) => {
  let count = 0;
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "createLocal"
    )
      count++;
    ts.forEachChild(node, visit);
  };
  visit(file);
  return count;
};
// 26 source callsites: 13 root + 13 instantiated for each of point/start/end.
assert.equal(countSlots(current), 26);
assert.equal(countSlots(original), 26);
const printer = ts.createPrinter({ removeComments: true });
let preserved = 0;
for (const old of original.statements.filter(ts.isFunctionDeclaration)) {
  if (!old.name || !old.body || old.name.text === "createCriteriaDateBundle")
    continue;
  const now = current.statements.find(
    (node) =>
      ts.isFunctionDeclaration(node) && node.name?.text === old.name.text,
  );
  assert(now?.body, old.name.text);
  assert.equal(
    printer.printNode(ts.EmitHint.Unspecified, now.body, current),
    printer.printNode(ts.EmitHint.Unspecified, old.body, original),
    old.name.text,
  );
  preserved++;
}
assert(
  !/\bDate\.now\s*\(|\b(?:setTimeout|requestAnimationFrame)\s*\(/.test(text),
);
assert(!/\.dispatch\s*\(|\.connect\s*\(/.test(text));
const names = await readdir(new URL("./", import.meta.url));
let typed = 1,
  script = 0;
for (const name of names) {
  if (/\.(ts|tsx)$/.test(name)) {
    parse(name, await readFile(new URL(name, import.meta.url), "utf8"));
    typed++;
  }
  if (name.endsWith(".mjs")) {
    const result = spawnSync(
      process.execPath,
      ["--check", fileURLToPath(new URL(name, import.meta.url))],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    script++;
  }
}
console.log(
  `${typed} positive/source TS files parsed; ${script} scripts/configs syntax-checked; ${preserved} unchanged source-private exported helper bodies; 26 createLocal sites / 52 finite instantiated slots unchanged; 0 emits/app modules loaded. Negative program not type-checked/executed.`,
);
