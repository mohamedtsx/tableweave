import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = new URL("./", import.meta.url);
const artifacts = new URL("./.artifacts/", own);
await mkdir(new URL("type-fixtures/", artifacts), { recursive: true });
const original = await readFile(new URL("types.ts", own), "utf8");
const negatives = [...original.matchAll(/\/\/ @ts-expect-error[^\n]*/g)];
assert.equal(negatives.length, 25);
let checked = 0;
for (const name of ["typescript", "typescript-5-9"]) {
  const ts = (await import(name)).default;
  execFileSync(
    process.execPath,
    [
      `node_modules/${name}/bin/tsc`,
      "-p",
      "tests/criteria-publication/tsconfig.json",
    ],
    { cwd: root, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      `node_modules/${name}/bin/tsc`,
      "-p",
      "tests/criteria-publication/tsconfig.emit.json",
      "--outDir",
      "tests/criteria-publication/.artifacts/emitted",
    ],
    { cwd: root, stdio: "inherit" },
  );
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    skipLibCheck: false,
    noEmit: true,
    types: [],
    lib: ["lib.es2022.d.ts"],
  };
  for (const mode of ["source", "emitted"]) {
    const path = new URL(`type-fixtures/${name}-${mode}.ts`, artifacts);
    const input = original.replaceAll(
      "../../packages/react/src/",
      mode === "source" ? "../../../../packages/react/src/" : "../emitted/",
    );
    const compile = async (text) => {
      await writeFile(path, text);
      const program = ts.createProgram([fileURLToPath(path)], options);
      return ts.getPreEmitDiagnostics(program).map((d) => ({
        code: d.code,
        message: ts.flattenDiagnosticMessageText(d.messageText, " "),
        file: d.file?.fileName,
        line:
          d.file && d.start !== undefined
            ? d.file.getLineAndCharacterOfPosition(d.start).line + 1
            : 0,
      }));
    };
    assert.deepEqual(
      await compile(input),
      [],
      `${name}/${mode} positive/directive baseline`,
    );
    for (const match of [...input.matchAll(/\/\/ @ts-expect-error[^\n]*/g)]) {
      const line = input.slice(0, match.index).split("\n").length + 1;
      const text =
        input.slice(0, match.index) +
        " ".repeat(match[0].length) +
        input.slice(match.index + match[0].length);
      const diagnostics = await compile(text);
      assert(diagnostics.length > 0, `Expected rejection at ${line}`);
      for (const d of diagnostics) {
        assert.equal(d.file, fileURLToPath(path));
        assert.equal(d.line, line, JSON.stringify(d));
        assert(
          [2322, 2345, 2353, 2379, 2684, 2540].includes(d.code),
          JSON.stringify(d),
        );
      }
      checked++;
    }
    await writeFile(path, input);
    console.log(
      `${name} ${ts.version} ${mode}: positives + ${negatives.length} meaningful independent negatives`,
    );
  }
}
console.log(
  `${checked} negative/compiler/mode checks; strict skipLibCheck=false, no stubs.`,
);
