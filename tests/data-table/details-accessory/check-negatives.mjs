// Authored for the single final phase; not run during implementation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require(process.argv[2] ?? "typescript");
const config = fileURLToPath(new URL("tsconfig.light.json", import.meta.url));
const negative = fileURLToPath(new URL("types.negative.ts", import.meta.url));
const input = readFileSync(negative, "utf8");
const markers = input
  .split("\n")
  .flatMap((line, index) =>
    line.includes("@ts-expect-error P4-N") ? [index + 2] : [],
  );
const parsed = ts.getParsedCommandLineOfConfigFile(
  config,
  { noEmit: true },
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw Error(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      );
    },
  },
);
assert.ok(parsed);
const host = ts.createCompilerHost(parsed.options),
  read = host.readFile;
host.readFile = (path) =>
  path === negative
    ? input.replaceAll("@ts-expect-error P4-N", "authored P4-N")
    : read(path);
const program = ts.createProgram(
  [...parsed.fileNames, negative],
  parsed.options,
  host,
);
const diagnostics = ts.getPreEmitDiagnostics(program);
const own = diagnostics.filter((d) => d.file?.fileName === negative);
const locations = own.map(
  (d) => d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1,
);
for (const line of markers)
  assert.ok(locations.includes(line), `Missing real rejection on line ${line}`);
assert.equal(
  diagnostics.length,
  own.length,
  "Unexpected positive-source failure",
);
assert.equal(
  own.length,
  markers.length,
  "Unexpected negative-fixture diagnostic",
);
process.stdout.write(
  `${ts.version}: ${markers.length} meaningful rejections\n`,
);
