import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { own, root, source } from "./guard.mjs";

const label = process.env.EXECUTION_TYPES_RUN ?? "types";
assert(/^[a-z][a-z0-9-]*$/.test(label));
const directory = join(own, ".artifacts", label);
await mkdir(directory, { recursive: true });
const template = await readFile(join(own, "types.ts"), "utf8");
const expected = [...template.matchAll(/@ts-expect-error/g)].length;
assert.equal(expected, 13);
const results = [];
async function run(compiler, configuration, name, negative = false) {
  const result = spawnSync(
    process.execPath,
    [
      join(root, "node_modules", compiler, "bin/tsc"),
      "-p",
      configuration,
      "--pretty",
      "false",
    ],
    {
      cwd: own,
      encoding: "utf8",
      env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
    },
  );
  await writeFile(
    join(directory, `${compiler}-${name}.log`),
    result.stdout + result.stderr,
  );
  if (result.error) throw result.error;
  if (negative) {
    assert.notEqual(result.status, 0);
    const diagnostics = [
      ...result.stdout.matchAll(/negative\.ts\((\d+),\d+\): error TS(\d+):/g),
    ];
    assert.equal(
      new Set(diagnostics.map((item) => item[1])).size,
      expected,
      result.stdout,
    );
    assert(
      diagnostics.every((item) =>
        ["2322", "2339", "2345", "2353", "2379", "2540"].includes(item[2]),
      ),
      result.stdout,
    );
    assert(!/error TS(?:2307|7016|2688|2578)/.test(result.stdout));
    results.push({
      compiler,
      mode: name,
      rejectedLines: expected,
      codes: [...new Set(diagnostics.map((item) => item[2]))],
    });
  } else {
    assert.equal(result.status, 0, result.stdout + result.stderr);
    results.push({ compiler, mode: name, passed: true });
  }
}
for (const compiler of ["typescript", "typescript-5-9"]) {
  const emitted = join(own, ".artifacts", `emitted-${compiler}`);
  const emitConfig = join(directory, `${compiler}-emit.json`);
  await writeFile(
    emitConfig,
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
          join(root, source),
          join(root, "packages/react/src/contracts/index.ts"),
        ],
      },
      null,
      2,
    ),
  );
  await run(compiler, emitConfig, "own-emit");
  for (const mode of ["source", "emitted"]) {
    const fixtureDir = join(directory, `${compiler}-${mode}`);
    await mkdir(fixtureDir, { recursive: true });
    let text = template;
    for (const name of ["execution", "index"])
      text = text.replace(
        `../../../packages/react/src/contracts/${name}.js`,
        mode === "source"
          ? join(root, "packages/react/src/contracts", `${name}.js`)
          : join(emitted, "contracts", `${name}.js`),
      );
    for (const negative of [false, true]) {
      const kind = negative ? "negative" : "positive";
      const file = join(fixtureDir, `${kind}.ts`);
      await writeFile(
        file,
        negative ? text.replace(/^.*@ts-expect-error.*$/gm, "") : text,
      );
      const configuration = join(fixtureDir, `${kind}.json`);
      await writeFile(
        configuration,
        JSON.stringify(
          {
            extends: join(root, "tsconfig.base.json"),
            compilerOptions: {
              noEmit: true,
              module: "ESNext",
              moduleResolution: "Bundler",
              lib: ["ES2022", "ES2023.Intl"],
              types: mode === "source" ? ["node"] : [],
              typeRoots: [join(root, "node_modules/@types")],
            },
            files: [file],
          },
          null,
          2,
        ),
      );
      await run(compiler, configuration, `${mode}-${kind}`, negative);
    }
  }
}
const units = join(directory, "units.json");
await writeFile(
  units,
  JSON.stringify(
    {
      extends: join(root, "tsconfig.base.json"),
      compilerOptions: {
        noEmit: true,
        lib: ["ES2022", "ES2023.Intl", "DOM"],
        types: ["node"],
        typeRoots: [join(root, "node_modules/@types")],
      },
      files: [join(own, "fixtures.ts"), join(own, "execution.test.ts")],
    },
    null,
    2,
  ),
);
for (const compiler of ["typescript", "typescript-5-9"])
  await run(compiler, units, "own-units");
await writeFile(
  join(directory, "results.json"),
  JSON.stringify(results, null, 2),
);
console.log(
  `TS6/5.9 strict source/own-emitted + own unit programs pass; ${expected} meaningful negative lines per compiler/mode`,
);
