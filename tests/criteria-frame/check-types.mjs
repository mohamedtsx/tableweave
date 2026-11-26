import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { own, root } from "./scope.mjs";

// Authored final-phase runner only. One all-removed program per compiler/mode.
const run = process.env.F1_TYPES_RUN ?? "types";
assert(/^[a-z][a-z0-9-]*$/.test(run));
const output = join(own, ".artifacts", run);
await mkdir(output, { recursive: true });
const vendor = createRequire(join(root, "packages/react/package.json")),
  paths = {};
for (const name of [
  "@tanstack/react-table",
  "@tanstack/table-core",
  "@tanstack/table-core/reactivity",
  "@tanstack/table-core/store-reactivity-bindings",
])
  paths[name] = [
    (await realpath(vendor.resolve(name))).replace(/\.js$/, ".d.ts"),
  ];
const tableVendor = createRequire(vendor.resolve("@tanstack/react-table"));
paths["@tanstack/react-store"] = [
  (await realpath(tableVendor.resolve("@tanstack/react-store"))).replace(
    /\.c?js$/,
    ".d.ts",
  ),
];
const template = await readFile(join(own, "types.ts"), "utf8");
assert.equal([...template.matchAll(/@ts-expect-error F1-N/g)].length, 15);
const results = [];
async function compile(compiler, config, label) {
  const result = spawnSync(
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
    result.stdout + result.stderr,
  );
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stdout + result.stderr);
  results.push({ compiler, label, passed: true });
}
for (const compiler of ["typescript", "typescript-5-9"]) {
  const ts = createRequire(join(root, "package.json"))(compiler);
  for (const [label, config] of [
    ["react-source", "packages/react/tsconfig.json"],
    ["own-fixtures", "tests/criteria-frame/tsconfig.light.json"],
  ])
    await compile(compiler, join(root, config), label);
  const emitted = join(output, `${compiler}-emitted`),
    config = join(output, `${compiler}-emit.json`);
  await writeFile(
    config,
    JSON.stringify(
      {
        extends: join(root, "tsconfig.base.json"),
        compilerOptions: {
          rootDir: join(root, "packages/react/src"),
          outDir: emitted,
          declaration: true,
          noEmitOnError: true,
          lib: ["ES2022", "ES2023.Intl", "DOM"],
          types: [],
          paths,
        },
        files: ["presentation/criteria-frame.ts", "tanstack/sort.ts"].map(
          (path) => join(root, "packages/react/src", path),
        ),
      },
      null,
      2,
    ),
  );
  await compile(compiler, config, "own-emission");
  for (const mode of ["source", "emitted"]) {
    const directory = join(output, `${compiler}-${mode}`);
    await mkdir(directory, { recursive: true });
    const file = join(directory, "consumer.ts"),
      text = template
        .replaceAll(
          "../../packages/react/src/",
          `${mode === "source" ? join(root, "packages/react/src") : emitted}/`,
        )
        .replaceAll(
          "../../packages/react/node_modules/@tanstack/react-table/dist/index.js",
          vendor.resolve("@tanstack/react-table"),
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
      lib: ["lib.es2022.d.ts", "lib.es2023.intl.d.ts", "lib.dom.d.ts"],
      paths,
    };
    async function check(source) {
      await writeFile(file, source);
      const program = ts.createProgram({ rootNames: [file], options });
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
      `${compiler}/${mode} positive/directive consumer`,
    );
    const matches = [...text.matchAll(/\/\/ @ts-expect-error F1-N\d+[^\n]*/g)],
      expectedLines = matches.map(
        (match) => text.slice(0, match.index).split("\n").length + 1,
      );
    const diagnostics = await check(
      text.replace(/\/\/ @ts-expect-error F1-N\d+[^\n]*/g, (match) =>
        " ".repeat(match.length),
      ),
    );
    for (const d of diagnostics) {
      assert.equal(d.file, file);
      assert(expectedLines.includes(d.line), JSON.stringify(d));
      assert(
        [2322, 2339, 2345, 2353, 2375, 2540, 2684, 2741].includes(d.code),
        JSON.stringify(d),
      );
    }
    for (const line of expectedLines)
      assert(
        diagnostics.some((d) => d.line === line),
        `Missing meaningful negative line${line}`,
      );
    await writeFile(file, text);
    await writeFile(
      join(directory, "all-removed-diagnostics.json"),
      JSON.stringify({ expectedLines, diagnostics }, null, 2),
    );
    results.push({
      compiler,
      mode,
      negativeLines: expectedLines.length,
      allRemovedPrograms: 1,
    });
  }
}
await writeFile(join(output, "results.json"), JSON.stringify(results, null, 2));
console.log(
  "F1 strict source/emitted dual compilers and60 expected negative-line checks passed.",
);
