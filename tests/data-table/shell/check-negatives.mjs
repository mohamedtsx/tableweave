// Authored ONLY for the user's final phase. No negative/dual program ran here.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url),
  ts = require(process.argv[2] ?? "typescript"),
  path = fileURLToPath(new URL("negative-types.tsx", import.meta.url));
const input = readFileSync(path, "utf8"),
  expected = input
    .split("\n")
    .flatMap((line, index) =>
      line.includes("@ts-expect-error SHELL-N") ? [index + 2] : [],
    );
const config = ts.getParsedCommandLineOfConfigFile(
  fileURLToPath(new URL("tsconfig.light.json", import.meta.url)),
  { noEmit: true },
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: () => assert.fail("Negative config"),
  },
);
assert.ok(config);
const host = ts.createCompilerHost(config.options),
  read = host.readFile;
host.readFile = (file) =>
  file === path
    ? input.replaceAll("@ts-expect-error SHELL-N", "authored SHELL-N")
    : read(file);
const diagnostics = ts.getPreEmitDiagnostics(
    ts.createProgram([...config.fileNames, path], config.options, host),
  ),
  own = diagnostics.filter((d) => d.file?.fileName === path),
  lines = own.map(
    (d) => d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1,
  );
for (const line of expected)
  assert.ok(lines.includes(line), `Missing meaningful rejection on ${line}`);
assert.equal(diagnostics.length, expected.length);
assert.equal(own.length, expected.length);
process.stdout.write(
  `${ts.version}: ${expected.length} meaningful model-anchored rejections\n`,
);
