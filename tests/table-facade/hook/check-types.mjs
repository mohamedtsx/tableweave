// Authored final-phase checks only. No shared emission or installed-root proof.
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
const template = await readFile(join(own, "types.negative.ts"), "utf8");
assert.equal([...template.matchAll(/@ts-expect-error P2-N/g)].length, 9);
async function compile(compiler, config, label) {
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
}
const results = [];
for (const compiler of ["typescript", "typescript-5-9"]) {
  const ts = createRequire(join(root, "package.json"))(compiler);
  await compile(
    compiler,
    join(own, "tsconfig.light.json"),
    "positive-fixtures",
  );
  const emitted = join(output, `${compiler}-emitted`),
    config = join(output, `${compiler}-emit.json`);
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
          lib: ["ES2022", "ES2023.Intl", "DOM"],
          types: [],
          paths,
        },
        files: [
          join(root, "packages/react/src/table/use-data-table.ts"),
          join(own, "fixtures.ts"),
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
    const file = join(directory, "consumer.ts");
    const text = template
      .replaceAll(
        "../../../packages/react/src/",
        `${mode === "source" ? join(root, "packages/react/src") : join(emitted, "packages/react/src")}/`,
      )
      .replaceAll(
        '"./fixtures.js"',
        JSON.stringify(
          join(
            mode === "source" ? own : join(emitted, "tests/table-facade/hook"),
            "fixtures.js",
          ),
        ),
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
    assert.deepEqual(await check(text), []);
    const matches = [...text.matchAll(/\/\/ @ts-expect-error P2-N\d+[^\n]*/g)],
      lines = matches.map((m) => text.slice(0, m.index).split("\n").length + 1);
    const diagnostics = await check(
      text.replace(/\/\/ @ts-expect-error P2-N\d+[^\n]*/g, (m) =>
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
    results.push({ compiler, mode, negativeLines: 9 });
  }
}
await writeFile(
  join(output, "results.json"),
  JSON.stringify(
    { results, removedNegativeLineChecks: 36, packedConsumer: false },
    null,
    2,
  ),
);
