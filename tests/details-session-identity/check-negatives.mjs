// Deferred final-phase runner. Do not execute during provisional authoring.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const compiler = process.argv[2] ?? "typescript";
assert.ok(["typescript", "typescript-5-9"].includes(compiler));
const ts = createRequire(import.meta.url)(compiler);

const configPath = fileURLToPath(
  new URL("tsconfig.negative.json", import.meta.url),
);
const input = ts.readConfigFile(configPath, ts.sys.readFile);
assert.equal(input.error, undefined);
const config = ts.parseJsonConfigFileContent(
  input.config,
  ts.sys,
  fileURLToPath(new URL("./", import.meta.url)),
);
const fixturePath = fileURLToPath(
  new URL("types.negative.ts", import.meta.url),
);
const text = await readFile(fixturePath, "utf8");
const host = ts.createCompilerHost(config.options);
const annotated = ts.createProgram(config.fileNames, config.options, host);
assert.equal(
  ts.getPreEmitDiagnostics(annotated).length,
  0,
  "Annotated negative fixture must compile",
);
const stripped = text.replace(/\/\/ @ts-expect-error[^\n]*/g, (match) =>
  " ".repeat(match.length),
);
const read = host.readFile.bind(host);
host.readFile = (path) => (path === fixturePath ? stripped : read(path));
const program = ts.createProgram(config.fileNames, config.options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
const lines = text.split("\n");
const markers = lines.flatMap((line, i) =>
  line.includes("@ts-expect-error") ? [i + 1] : [],
);
assert.equal(markers.length, 4);
for (const line of markers) {
  assert.ok(
    diagnostics.some(
      (d) =>
        d.file?.fileName === fixturePath &&
        d.start !== undefined &&
        d.file.getLineAndCharacterOfPosition(d.start).line === line,
    ),
    `Missing meaningful rejection for line ${line + 1}`,
  );
}
assert.equal(
  diagnostics.filter((d) => d.file?.fileName !== fixturePath).length,
  0,
);
process.stdout.write(
  "Four authored source negatives reject at their own marker lines. No emitted/packed proof.\n",
);
