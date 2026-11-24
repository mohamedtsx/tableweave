// FINAL-PHASE ONLY: actual compiler programs, no source/declaration stubs.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const compiler = process.argv[2];
assert(
  ["typescript", "typescript-5-9"].includes(compiler),
  "Name an installed compiler",
);
const require = createRequire(import.meta.url);
const ts = require(compiler);
const configPath = fileURLToPath(
  new URL("./tsconfig.negative.json", import.meta.url),
);
const config = ts.readConfigFile(configPath, ts.sys.readFile);
assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(
  config.config,
  ts.sys,
  fileURLToPath(new URL("./", import.meta.url)),
);
assert.equal(parsed.errors.length, 0);
const negative = fileURLToPath(new URL("./negative-types.ts", import.meta.url));
const original = await readFile(negative, "utf8");
const directives = [...original.matchAll(/\/\/ @ts-expect-error[^\n]*/g)];
assert(directives.length > 0);
function diagnostics(text) {
  const host = ts.createCompilerHost(parsed.options);
  const read = host.readFile;
  host.readFile = (path) => (path === negative ? text : read(path));
  return ts.getPreEmitDiagnostics(
    ts.createProgram(parsed.fileNames, parsed.options, host),
  );
}
assert.deepEqual(
  diagnostics(original),
  [],
  "Baseline fixture directives must all be meaningful",
);
for (const [index, match] of directives.entries()) {
  const offset = match.index;
  const text =
    original.slice(0, offset) +
    " ".repeat(match[0].length) +
    original.slice(offset + match[0].length);
  const next = directives[index + 1]?.index ?? original.length;
  const errors = diagnostics(text);
  const intended = errors.filter(
    (error) =>
      error.file?.fileName === negative &&
      error.start >= offset &&
      error.start < next &&
      error.code !== 2578,
  );
  assert(
    intended.length > 0,
    `Negative ${index + 1} produced no intended error`,
  );
  assert(
    errors.every((error) => intended.includes(error)),
    "Unrelated diagnostics cannot prove a negative",
  );
  console.log(
    `${ts.version} negative ${index + 1}: ${intended.map((error) => `${error.code} ${ts.flattenDiagnosticMessageText(error.messageText, " ")}`).join(" | ")}`,
  );
}
