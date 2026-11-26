import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { own, root } from "./guard.mjs";

const run = process.env.U3_TYPES_RUN ?? "types";
assert(/^[a-z][a-z0-9-]*$/.test(run));
const output = join(own, ".artifacts", run);
await mkdir(output, { recursive: true });
const template = await readFile(join(own, "types.ts"), "utf8");
assert.equal([...template.matchAll(/@ts-expect-error/g)].length, 16);
const results = [];
async function tsc(compiler, config, label) {
  const r = spawnSync(
    process.execPath,
    [
      join(root, "node_modules", compiler, "bin/tsc"),
      "-p",
      config,
      "--pretty",
      "false",
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
    },
  );
  await writeFile(
    join(output, `${compiler}-${label}.log`),
    r.stdout + r.stderr,
  );
  if (r.error) throw r.error;
  assert.equal(r.status, 0, r.stdout + r.stderr);
  results.push({ compiler, label, passed: true });
}
for (const compiler of ["typescript", "typescript-5-9"]) {
  const ts = createRequire(join(root, "package.json"))(compiler);
  await tsc(
    compiler,
    join(root, "packages/react/tsconfig.json"),
    "whole-react-source",
  );
  const emitted = join(own, ".artifacts", `emitted-${compiler}`),
    emit = join(output, `${compiler}-emit.json`);
  await writeFile(
    emit,
    JSON.stringify(
      {
        extends: join(root, "tsconfig.base.json"),
        compilerOptions: {
          rootDir: join(root, "packages/react/src"),
          outDir: emitted,
          declaration: true,
          noEmitOnError: true,
          lib: ["ES2022", "ES2023.Intl"],
          types: ["node"],
          typeRoots: [join(root, "node_modules/@types")],
        },
        files: [
          join(root, "packages/react/src/resource/adapter.ts"),
          join(root, "packages/react/src/resource/view.ts"),
          join(root, "packages/react/src/contracts/index.ts"),
          join(root, "packages/react/src/filters/registry.ts"),
        ],
      },
      null,
      2,
    ),
  );
  await tsc(compiler, emit, "own-emit");
  for (const mode of ["source", "emitted"]) {
    const folder = join(output, `${compiler}-${mode}`);
    await mkdir(folder, { recursive: true });
    const file = join(folder, "fixture.ts");
    const text = template.replaceAll(
      "../../../packages/react/src/",
      `${mode === "source" ? join(root, "packages/react/src") : emitted}/`,
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
      lib: ["lib.es2022.d.ts", "lib.es2023.intl.d.ts"],
      types: mode === "source" ? ["node"] : [],
      typeRoots: [join(root, "node_modules/@types")],
    };
    let previous;
    async function check(value) {
      await writeFile(file, value);
      const program = ts.createProgram({
        rootNames: [file],
        options,
        oldProgram: previous,
      });
      previous = program;
      return ts.getPreEmitDiagnostics(program).map((d) => ({
        code: d.code,
        file: d.file?.fileName,
        line:
          d.file && d.start !== undefined
            ? d.file.getLineAndCharacterOfPosition(d.start).line + 1
            : 0,
        message: ts.flattenDiagnosticMessageText(d.messageText, " "),
      }));
    }
    assert.deepEqual(
      await check(text),
      [],
      `${compiler}/${mode} positive/directive baseline`,
    );
    const negatives = [];
    for (const match of [...text.matchAll(/\/\/ @ts-expect-error[^\n]*/g)]) {
      const line = text.slice(0, match.index).split("\n").length + 1,
        errors = await check(
          text.slice(0, match.index) +
            " ".repeat(match[0].length) +
            text.slice(match.index + match[0].length),
        );
      assert(errors.length > 0);
      for (const error of errors) {
        assert.equal(error.file, file);
        assert.equal(error.line, line, JSON.stringify(error));
        assert(
          [2322, 2339, 2353, 2375, 2540].includes(error.code),
          JSON.stringify(error),
        );
      }
      negatives.push({ line, errors });
    }
    assert.deepEqual(await check(text), []);
    await writeFile(
      join(output, `${compiler}-${mode}-negatives.json`),
      JSON.stringify(negatives, null, 2),
    );
    results.push({
      compiler,
      mode,
      positive: true,
      independentNegatives: negatives.length,
    });
    console.log(`${compiler}/${mode}:16 meaningful individual negatives`);
  }
  const ownConfig = join(output, `${compiler}-tests.json`);
  await writeFile(
    ownConfig,
    JSON.stringify(
      {
        extends: join(root, "tsconfig.base.json"),
        compilerOptions: {
          noEmit: true,
          allowJs: true,
          checkJs: false,
          lib: ["ES2022", "ES2023.Intl", "DOM"],
          types: ["node"],
          typeRoots: [join(root, "node_modules/@types")],
        },
        files: [
          "types.ts",
          "fixtures.ts",
          "baseline.test.ts",
          "before-policy.test.ts",
          "metadata.test.ts",
          "success.test.ts",
          "lifecycle.test.ts",
        ].map((p) => join(own, p)),
      },
      null,
      2,
    ),
  );
  await tsc(compiler, ownConfig, "own-test-fixtures");
}
await writeFile(join(output, "results.json"), JSON.stringify(results, null, 2));
console.log(
  "TS6/5.9 whole React/source/own-emitted/fixtures +64 individual meaningful negatives pass",
);
