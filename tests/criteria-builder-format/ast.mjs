import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const before = JSON.parse(await readFile(new URL("./before.json", import.meta.url), "utf8"));
const hash = value => createHash("sha256").update(value).digest("hex");
const trivia = new Set(["pos", "end", "parent", "transformFlags", "modifierFlagsCache", "id", "emitNode", "original", "jsDoc", "jsDocCache", "multiLine", "singleQuote", "hasTrailingComma"]);

// React/TS JSX whitespace semantics for whitespace-only text: single-line
// spaces remain meaningful; newline indentation alone emits no text. Never trim
// or collapse a string literal, regex, template, or content-bearing JSX text.
function whitespace(text) {
  assert(/^\s*$/.test(text));
  const lines = text.split(/\r\n|\n|\r/);
  let result = "";
  for (let index = 0; index < lines.length; index++) {
    let line = lines[index].replace(/\t/g, " ");
    if (index !== 0) line = line.replace(/^ +/, "");
    if (index !== lines.length - 1) line = line.replace(/ +$/, "");
    result += line;
  }
  return result;
}
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize).filter(item => item !== null);
  if (value === undefined) return "<undefined>";
  if (value === null || typeof value !== "object") return value;
  if (ts.isParenthesizedExpression(value)) return normalize(value.expression);
  if (ts.isParenthesizedTypeNode(value)) return normalize(value.type);
  if (ts.isJsxText(value) && /^\s*$/.test(value.text)) {
    const text = whitespace(value.text);
    return text === "" ? null : { kind: ts.SyntaxKind.JsxText, text };
  }
  if (ts.isSourceFile(value)) return { kind: value.kind, statements: normalize(value.statements), endOfFileToken: normalize(value.endOfFileToken) };
  return Object.fromEntries(Object.keys(value).sort().filter(key => !trivia.has(key)).map(key => [key, normalize(value[key])]));
}
function parse(path, text) {
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  assert.equal(file.parseDiagnostics.length, 0, path);
  return file;
}
function comments(text, file) {
  // Parser token boundaries avoid misclassifying regex/template/JSX text as
  // comments, and include comments before an otherwise empty closing brace.
  const ranges = new Map();
  const visit = node => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode) return;
    for (const position of [node.pos, node.end]) {
      for (const range of [...ts.getLeadingCommentRanges(text, position) ?? [], ...ts.getTrailingCommentRanges(text, position) ?? []]) ranges.set(range.pos, range);
    }
    for (const child of node.getChildren(file)) visit(child);
  };
  visit(file);
  return [...ranges.values()].sort((a, b) => a.pos - b.pos).map(range => [range.kind, text.slice(range.pos, range.end).replace(/\s+/g, " ").trim()]);
}
const reference = process.argv[2] === "reference", report = {};
for (const [path, captured] of Object.entries(before.preimages)) {
  const original = await readFile(new URL(captured.preimage, root), "utf8");
  assert.equal(hash(original), captured.sha256, path);
  const target = reference ? new URL(`./.artifacts/reference/${path.split("/").at(-1)}.txt`, import.meta.url) : new URL(path, root);
  const formatted = await readFile(target, "utf8"), a = parse(path, original), b = parse(path, formatted);
  assert.deepEqual(normalize(b), normalize(a), `${path}: normalized syntax/literals/operators/order/JSX semantics changed`);
  const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
  const printedA = parse(path, printer.printFile(a)), printedB = parse(path, printer.printFile(b));
  assert.deepEqual(normalize(printedB), normalize(printedA), `${path}: TS-printer roundtrip AST changed`);
  assert.deepEqual(comments(formatted, b), comments(original, a), `${path}: comment content/order changed`);
  const imports = file => file.statements.filter(ts.isImportDeclaration).map(normalize);
  assert.deepEqual(imports(b), imports(a), `${path}: import statement/specifier order changed`);
  if (!reference) assert.equal(formatted, await readFile(new URL(`./.artifacts/reference/${path.split("/").at(-1)}.txt`, import.meta.url), "utf8"), `${path}: patch differs from exact installed formatter reference`);
  assert(!/[\t ]+$/m.test(formatted), `${path}: trailing whitespace`);
  assert(!formatted.includes("\r") && formatted.endsWith("\n") && !formatted.endsWith("\n\n"), `${path}: LF/single final newline`);
  report[path] = { before: hash(original), after: hash(formatted), normalizedAst: hash(JSON.stringify(normalize(a))), printedAst: hash(JSON.stringify(normalize(printedA))), comments: comments(original, a).length, importStatements: imports(a).length, unchangedBytes: original === formatted };
}
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const output = new URL(`./.artifacts/${reference ? "reference" : "production"}-ast.json`, import.meta.url);
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Five ${reference ? "formatter references" : "patched production sources"}: exact normalized TS/JSX AST, ordered imports and comment content preserved. Report ${fileURLToPath(output)}. No application modules/emits/runtime loaded.`);
