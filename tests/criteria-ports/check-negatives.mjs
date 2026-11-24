// DEFERRED: individual actual compiler programs, never a source/authority stub.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const compiler = process.argv[2];
assert(["typescript", "typescript-5-9"].includes(compiler));
const ts = createRequire(import.meta.url)(compiler);
const path = fileURLToPath(
  new URL("./tsconfig.negative.json", import.meta.url),
);
const config = ts.readConfigFile(path, ts.sys.readFile);
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
  host.readFile = (file) => (file === negative ? text : read(file));
  return ts.getPreEmitDiagnostics(
    ts.createProgram(parsed.fileNames, parsed.options, host),
  );
}
assert.deepEqual(diagnostics(original), []);
for (const [index, directive] of directives.entries()) {
  const start = directive.index;
  const end = directives[index + 1]?.index ?? original.length;
  const text =
    original.slice(0, start) +
    " ".repeat(directive[0].length) +
    original.slice(start + directive[0].length);
  const errors = diagnostics(text);
  const intended = errors.filter(
    (error) =>
      error.file?.fileName === negative &&
      error.start >= start &&
      error.start < end &&
      error.code !== 2578,
  );
  assert(
    intended.length > 0,
    `No intended diagnostic for negative ${index + 1}`,
  );
  assert(
    errors.every((error) => intended.includes(error)),
    "Unrelated diagnostics do not prove a negative",
  );
  console.log(
    `${ts.version} negative ${index + 1}: ${intended.map((error) => `${error.code} ${ts.flattenDiagnosticMessageText(error.messageText, " ")}`).join(" | ")}`,
  );
}
