import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require(process.argv[2] ?? "typescript");
const directory = path.dirname(fileURLToPath(import.meta.url));
const config = path.join(directory, "tsconfig.light.json");
const input = ts.readConfigFile(config, ts.sys.readFile);
assert.equal(input.error, undefined);
const parsed = ts.parseJsonConfigFileContent(input.config, ts.sys, directory);
assert.equal(parsed.errors.length, 0);
const target = path.join(directory, "types.negative.ts");
const text = readFileSync(target, "utf8");
const lines = text.split("\n");
const expectedLines = lines.flatMap((line, index) =>
  line.includes("@ts-expect-error NEGATIVE") ? [index + 2] : [],
);
assert.equal(expectedLines.length, 4);

function diagnostics(source) {
  const host = ts.createCompilerHost(parsed.options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (filename, languageVersion, onError, shouldCreate) =>
    path.resolve(filename) === target
      ? ts.createSourceFile(filename, source, languageVersion, true)
      : original(filename, languageVersion, onError, shouldCreate);
  return ts.getPreEmitDiagnostics(
    ts.createProgram([...parsed.fileNames, target], parsed.options, host),
  );
}

const annotated = diagnostics(text);
assert.equal(
  annotated.length,
  0,
  ts.formatDiagnosticsWithColorAndContext(annotated, {
    getCanonicalFileName: (filename) => filename,
    getCurrentDirectory: () => directory,
    getNewLine: () => "\n",
  }),
);
const removed = diagnostics(
  lines
    .map((line) => (line.includes("@ts-expect-error NEGATIVE") ? "" : line))
    .join("\n"),
);
const observed = new Set(
  removed.flatMap((diagnostic) =>
    diagnostic.file &&
    path.resolve(diagnostic.file.fileName) === target &&
    diagnostic.start !== undefined
      ? [
          diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line +
            1,
        ]
      : [],
  ),
);
for (const line of expectedLines)
  assert(observed.has(line), `Missing negative diagnostic on line ${line}.`);
console.log(
  `Compiler ${ts.version}: annotated pass; 4 removed negatives rejected.`,
);
