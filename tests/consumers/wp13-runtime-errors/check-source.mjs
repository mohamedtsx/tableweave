import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const target = "tests/consumers/wp13/fixtures/family-runtime.mjs";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const before = spawnSync("git", ["show", `5853ef6:${target}`]);
assert.equal(before.status, 0);
const source = await readFile(target, "utf8");
const old = before.stdout.toString();
assert(old.includes("negativeWindow = false"));
assert(!source.includes("negativeWindow"));
assert(!source.includes("error.negative"));
assert(!source.includes("browserUnexpected"));
assert(source.includes("} else errors.push(message);"));
assert(source.includes("report.unexpectedErrors = errors.length;"));
assert(source.includes("report.intentionalErrors = expectedStderr.length;"));
const beforeRecognizer = old.slice(
  old.indexOf("export function genuineRsc"),
  old.indexOf("export async function run()"),
);
assert.equal(
  source.slice(
    source.indexOf("export function genuineRsc"),
    source.indexOf("export async function run()"),
  ),
  beforeRecognizer,
);
const ast = ts.createSourceFile(
  target,
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
assert.equal(ast.parseDiagnostics.length, 0);
let finalCount = false;
function visit(node) {
  if (
    ts.isBinaryExpression(node) &&
    node.left.getText(ast) === "report.unexpectedErrors" &&
    ts.isBinaryExpression(node.right)
  )
    finalCount ||= node.right.left.getText(ast) === "errors.length";
  ts.forEachChild(node, visit);
}
visit(ast);
assert(finalCount, "Final cleanup recount includes every browser error");
const runtime = JSON.parse(
  await readFile("tests/consumers/wp13-runtime/evidence/seal-001/seal.json"),
);
let unchanged = 0;
for (const [file, expected] of Object.entries(runtime.files))
  if (file !== target) {
    assert.equal(hash(await readFile(file)), expected.sha256, file);
    unchanged++;
  }
assert.equal(unchanged, 99);
const original = JSON.parse(
  await readFile("tests/consumers/wp13/evidence/source-seal-001/seal.json"),
);
const disclosed = new Set([
  "tests/consumers/wp13/families/vite.mjs",
  "tests/consumers/wp13/families/next.mjs",
  "tests/consumers/wp13/families/start.mjs",
  "tests/consumers/wp13/lib/generation.mjs",
  "tests/consumers/wp13/lib/installer.mjs",
]);
for (const [file, expected] of Object.entries(original.files))
  if (!disclosed.has(file))
    assert.equal(hash(await readFile(file)), expected.sha256, file);
const canonical = JSON.parse(
  await readFile("tests/consumers/wp13/evidence/source155.json"),
);
assert.equal(Object.keys(canonical).length, 155);
for (const [file, expected] of Object.entries(canonical))
  assert.equal(hash(await readFile(file)), expected.sha256, file);
console.log(
  "Static AST/error-attribution checks pass;99 other runtime-seal inputs,132 original-seal inputs and155 library bodies unchanged. No production module/test/CLI/browser or process executed.",
);
