import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("../../", import.meta.url), printer = ts.createPrinter({ removeComments: true });
function parse(path, text) {
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  assert.equal(file.parseDiagnostics.length, 0, path);
  return file;
}
const preimages = JSON.parse(await readFile(new URL("./resume-source-preimages.json", import.meta.url), "utf8"));
let bodies = 0;
for (const [path, text] of Object.entries(preimages)) {
  const before = parse(path, text), current = parse(path, await readFile(new URL(path, root), "utf8"));
  for (const original of before.statements.filter(ts.isFunctionDeclaration)) {
    if (!original.name || !original.body) continue;
    const name = ["FilterBuilder", "ValueEditor"].includes(original.name.text) ? `Legacy${original.name.text}` : original.name.text;
    const actual = current.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
    assert(actual?.body, name);
    assert.equal(printer.printNode(ts.EmitHint.Unspecified, actual.body, current), printer.printNode(ts.EmitHint.Unspecified, original.body, before), name);
    bodies++;
  }
}
let typed = 0, scripts = 0, localSites = 0;
const host = "packages/heroui/src/filters/criteria-builder-host.tsx";
const hostText = await readFile(new URL(host, root), "utf8");
const hostFile = parse(host, hostText);
const visit = node => { if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "createLocal") localSites++; ts.forEachChild(node, visit); };
visit(hostFile);
assert.equal(localSites, 14, "13 local cells + one presentation cell; Date owns 52 fixed slots separately");
assert(!/\b(?:setTimeout|requestAnimationFrame)\s*\(/.test(hostText));
assert(!/\.P\.(?:begin|complete)|\.publication\.(?:begin|complete)|\.clear\s*\(/.test(hostText.replace(/\b(?:local\.\w+|root\.\w+|frame\.local\.\w+)\.clear\s*\(/g, "(")));
for (const name of await readdir(new URL("./", import.meta.url))) {
  if (/\.(ts|tsx)$/.test(name)) { parse(name, await readFile(new URL(name, import.meta.url), "utf8")); typed++; }
  if (name.endsWith(".mjs")) {
    const result = spawnSync(process.execPath, ["--check", fileURLToPath(new URL(name, import.meta.url))], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr); scripts++;
  }
}
console.log(`${bodies} original raw function bodies unchanged; ${typed} own positive TS/TSX files parsed; ${scripts} scripts/configs syntax checked; ${localSites} own slot allocation sites + 52 frozen Date slots; no app modules/emits/runtime/negative execution.`);
