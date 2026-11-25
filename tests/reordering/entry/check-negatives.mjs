import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require(process.argv[2] ?? "typescript");
const directory = dirname(fileURLToPath(import.meta.url));
const target = join(directory, "negative.ts");
const config = ts.readConfigFile(
  join(directory, "tsconfig.negatives.json"),
  ts.sys.readFile,
);
assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, directory);
assert.equal(parsed.errors.length, 0);
const text = readFileSync(target, "utf8");
const lines = text.split("\n");
const expected = lines.flatMap((line, index) =>
  line.includes("@ts-expect-error NEGATIVE") ? [index + 2] : [],
);
assert.equal(expected.length, 5);
function diagnostics(source) {
  const host = ts.createCompilerHost(parsed.options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (filename, version, onError, fresh) =>
    resolve(filename) === target
      ? ts.createSourceFile(filename, source, version, true, ts.ScriptKind.TS)
      : original(filename, version, onError, fresh);
  return ts.getPreEmitDiagnostics(
    ts.createProgram(parsed.fileNames, parsed.options, host),
  );
}
const annotated = diagnostics(text);
assert.equal(
  annotated.length,
  0,
  ts.formatDiagnosticsWithColorAndContext(annotated, {
    getCanonicalFileName: (value) => value,
    getCurrentDirectory: () => directory,
    getNewLine: () => "\n",
  }),
);
const removed = diagnostics(
  lines
    .map((line) => (line.includes("@ts-expect-error NEGATIVE") ? "" : line))
    .join("\n"),
);
for (const diagnostic of removed)
  assert(
    diagnostic.file && resolve(diagnostic.file.fileName) === target,
    "Unexpected foreign program failure.",
  );
const observed = new Set(
  removed.flatMap((diagnostic) =>
    diagnostic.start === undefined
      ? []
      : [
          diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line +
            1,
        ],
  ),
);
for (const line of expected)
  assert(observed.has(line), `Missing intended rejection on line ${line}.`);
console.log(
  `Compiler ${ts.version}: annotated baseline and all five intended removed-directive rejections pass.`,
);
