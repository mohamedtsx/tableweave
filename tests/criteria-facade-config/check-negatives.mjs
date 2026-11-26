// Authored for the user's final phase, not executed during implementation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url),
  ts = require(process.argv[2] ?? "typescript");
const path = fileURLToPath(new URL("negative-types.tsx", import.meta.url)),
  input = readFileSync(path, "utf8");
const markers = input
  .split("\n")
  .flatMap((line, index) =>
    line.includes("@ts-expect-error S3-N") ? [index + 2] : [],
  );
const config = ts.getParsedCommandLineOfConfigFile(
  fileURLToPath(new URL("tsconfig.light.json", import.meta.url)),
  { noEmit: true },
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: () => {
      throw new Error("Negative config failed");
    },
  },
);
assert.ok(config);
const host = ts.createCompilerHost(config.options),
  read = host.readFile;
host.readFile = (file) =>
  file === path
    ? input.replaceAll("@ts-expect-error S3-N", "authored S3-N")
    : read(file);
const diagnostics = ts.getPreEmitDiagnostics(
    ts.createProgram([...config.fileNames, path], config.options, host),
  ),
  own = diagnostics.filter((d) => d.file?.fileName === path),
  lines = own.map(
    (d) => d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1,
  );
for (const line of markers)
  assert.ok(lines.includes(line), `Missing real rejection on line ${line}`);
assert.equal(own.length, markers.length);
assert.equal(diagnostics.length, own.length);
process.stdout.write(
  `${ts.version}: ${markers.length} meaningful rejections\n`,
);
