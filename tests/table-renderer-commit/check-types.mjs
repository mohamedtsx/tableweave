// Authored final-phase matrix, not executed during implementation.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { own, root } from "./scope.mjs";

const output = join(own, ".artifacts/final-types");
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
paths["@tanstack/react-store"] = [
  (
    await realpath(
      createRequire(vendor.resolve("@tanstack/react-table")).resolve(
        "@tanstack/react-store",
      ),
    )
  ).replace(/\.c?js$/, ".d.ts"),
];
const sourcePaths = {
  ...paths,
  ...Object.fromEntries(
    [
      ["@tableweave/react", "index.ts"],
      ["@tableweave/react/contracts", "contracts/index.ts"],
      ["@tableweave/react/filters", "filters/index.ts"],
    ].map(([name, path]) => [name, [join(root, "packages/react/src", path)]]),
  ),
};
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
}
const template = await readFile(join(own, "negative-types.ts"), "utf8");
assert.equal([...template.matchAll(/@ts-expect-error S1-N/g)].length, 10);
const results = [];
for (const compiler of ["typescript", "typescript-5-9"]) {
  const ts = createRequire(join(root, "package.json"))(compiler),
    emitted = join(output, `${compiler}-emitted`),
    config = join(output, `${compiler}-emit.json`);
  await compile(compiler, join(own, "tsconfig.json"), "positive-own");
  await compile(
    compiler,
    join(root, "tests/criteria-commit/tsconfig.json"),
    "positive-f3",
  );
  await writeFile(
    config,
    JSON.stringify(
      {
        extends: join(root, "tsconfig.base.json"),
        compilerOptions: {
          rootDir: root,
          outDir: emitted,
          declaration: true,
          noEmitOnError: true,
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          lib: ["ES2022", "ES2023.Intl", "DOM", "DOM.Iterable"],
          types: ["node", "react", "react-dom"],
          paths: sourcePaths,
        },
        files: [
          join(root, "packages/react/src/index.ts"),
          join(root, "packages/heroui/src/table/renderer-commit.ts"),
        ],
      },
      null,
      2,
    ),
  );
  await compile(compiler, config, "own-emission");
  for (const mode of ["source", "emitted"]) {
    const directory = join(output, `${compiler}-${mode}`);
    await mkdir(directory, { recursive: true });
    const candidateRoot = mode === "source" ? root : emitted;
    const modePaths = {
      ...paths,
      ...Object.fromEntries(
        [
          ["@tableweave/react", "index.ts"],
          ["@tableweave/react/contracts", "contracts/index.ts"],
          ["@tableweave/react/filters", "filters/index.ts"],
        ].map(([name, path]) => [
          name,
          [
            join(
              candidateRoot,
              "packages/react/src",
              mode === "source" ? path : path.replace(/\.ts$/, ".d.ts"),
            ),
          ],
        ]),
      ),
    };
    const file = join(directory, "consumer.ts"),
      text = template.replaceAll(
        "../../packages/heroui/src/",
        `${join(candidateRoot, "packages/heroui/src")}/`,
      );
    const options = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      exactOptionalPropertyTypes: true,
      noUncheckedIndexedAccess: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      skipLibCheck: false,
      noEmit: true,
      types: ["node", "react", "react-dom"],
      lib: [
        "lib.es2022.d.ts",
        "lib.es2023.intl.d.ts",
        "lib.dom.d.ts",
        "lib.dom.iterable.d.ts",
      ],
      paths: modePaths,
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
    assert.deepEqual(await check(text), []);
    const matches = [...text.matchAll(/\/\/ @ts-expect-error S1-N\d+[^\n]*/g)],
      lines = matches.map((m) => text.slice(0, m.index).split("\n").length + 1);
    const diagnostics = await check(
      text.replace(/\/\/ @ts-expect-error S1-N\d+[^\n]*/g, (m) =>
        " ".repeat(m.length),
      ),
    );
    for (const d of diagnostics) {
      assert.equal(d.file, file);
      assert(lines.includes(d.line), JSON.stringify(d));
    }
    for (const line of lines)
      assert(
        diagnostics.some((d) => d.line === line),
        `Missing negative ${line}`,
      );
    await writeFile(
      join(directory, "diagnostics.json"),
      JSON.stringify(diagnostics, null, 2),
    );
    results.push({ compiler, mode, lines: 10 });
  }
}
await writeFile(
  join(output, "results.json"),
  JSON.stringify(
    { results, removedNegativeLineChecks: 40, packed: false },
    null,
    2,
  ),
);
