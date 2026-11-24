// Authored final-phase source check. Does NOT claim emitted/packed coverage.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { own, root } from "./scope-paths.mjs";

const output = join(own, ".artifacts/final-negatives");
await mkdir(output, { recursive: true });
const text = await readFile(join(own, "negative-types.tsx"), "utf8");
const directives = [...text.matchAll(/\/\/ @ts-expect-error S2-N\d+[^\n]*/g)];
assert.equal(directives.length, 4);
const results = [];
for (const compiler of ["typescript", "typescript-5-9"]) {
  const ts = createRequire(join(root, "package.json"))(compiler);
  const read = ts.readConfigFile(join(own, "tsconfig.json"), ts.sys.readFile);
  assert.equal(read.error, undefined);
  const config = ts.parseJsonConfigFileContent(read.config, ts.sys, own);
  const file = join(output, `${compiler}.tsx`);
  const source = text.replaceAll(
    "../../packages/heroui/src/",
    `${join(root, "packages/heroui/src")}/`,
  );
  async function diagnostics(value) {
    await writeFile(file, value);
    const program = ts.createProgram({
      rootNames: [file],
      options: config.options,
    });
    return ts.getPreEmitDiagnostics(program).map((d) => ({
      file: d.file?.fileName,
      line:
        d.file && d.start !== undefined
          ? d.file.getLineAndCharacterOfPosition(d.start).line + 1
          : 0,
      code: d.code,
      message: ts.flattenDiagnosticMessageText(d.messageText, " "),
    }));
  }
  assert.deepEqual(await diagnostics(source), []);
  const diagnosticsWithout = await diagnostics(
    source.replace(/\/\/ @ts-expect-error S2-N\d+[^\n]*/g, (value) =>
      " ".repeat(value.length),
    ),
  );
  const lines = [
    ...source.matchAll(/\/\/ @ts-expect-error S2-N\d+[^\n]*/g),
  ].map((m) => source.slice(0, m.index).split("\n").length + 1);
  for (const diagnostic of diagnosticsWithout) {
    assert.equal(diagnostic.file, file);
    assert(lines.includes(diagnostic.line), JSON.stringify(diagnostic));
  }
  for (const line of lines)
    assert(
      diagnosticsWithout.some((d) => d.line === line),
      `Missing negative ${line}`,
    );
  await writeFile(
    join(output, `${compiler}.json`),
    `${JSON.stringify(diagnosticsWithout, null, 2)}\n`,
  );
  results.push({ compiler, lines: 4, mode: "source" });
}
await writeFile(
  join(output, "results.json"),
  `${JSON.stringify({ results, removedNegativeLineChecks: 8, emitted: false, packed: false }, null, 2)}\n`,
);
