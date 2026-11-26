import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { own, root } from "./guard.mjs";

const label = process.env.PAGINATION_TYPES_RUN ?? "types";
assert(/^[a-z][a-z0-9-]*$/.test(label));
const directory = join(own, ".artifacts", label);
await mkdir(directory, { recursive: true });
const template = await readFile(join(own, "types.ts"), "utf8");
const expected = [...template.matchAll(/@ts-expect-error/g)].length;
assert.equal(expected, 10);
const sourceImport = "../../../packages/react/src/contracts/index.js";
const results = [];
async function run(compiler, configuration, name, negative = false) {
  const args = [
    join(root, "node_modules", compiler, "bin/tsc"),
    "-p",
    configuration,
    "--pretty",
    "false",
  ];
  const result = spawnSync(process.execPath, args, {
    cwd: own,
    encoding: "utf8",
    env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  });
  await writeFile(
    join(directory, `${compiler}-${name}.log`),
    result.stdout + result.stderr,
  );
  if (result.error) throw result.error;
  if (negative) {
    assert.notEqual(
      result.status,
      0,
      "Negative vectors must actually fail without their annotations",
    );
    const diagnostics = [
      ...result.stdout.matchAll(/negative\.ts\((\d+),\d+\): error TS(\d+):/g),
    ];
    assert.equal(
      new Set(diagnostics.map((item) => item[1])).size,
      expected,
      result.stdout,
    );
    assert(
      diagnostics.every((item) => ["2322", "2375", "2540"].includes(item[2])),
      result.stdout,
    );
    assert(
      !/error TS(?:2307|7016|2688|2578)/.test(result.stdout),
      "Missing modules/unused annotations are not meaningful negatives",
    );
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
        include: [join(root, "packages/react/src/contracts/index.ts")],
      },
      null,
      2,
    ),
  );
  await run(compiler, emitConfig, "own-emit");
  for (const mode of ["source", "emitted"]) {
    const prefix = `${compiler}-${mode}`;
    const fixtureDir = join(directory, prefix);
    await mkdir(fixtureDir, { recursive: true });
    const target =
      mode === "source"
        ? join(root, "packages/react/src/contracts/index.js")
        : join(emitted, "contracts/index.js");
    const text = template.replace(sourceImport, target);
    const fixture = join(fixtureDir, "positive.ts");
    const negative = join(fixtureDir, "negative.ts");
    await writeFile(fixture, text);
    await writeFile(negative, text.replace(/^.*@ts-expect-error.*$/gm, ""));
    for (const [kind, file] of [
      ["positive", fixture],
      ["negative", negative],
    ]) {
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
      await run(
        compiler,
        configuration,
        `${mode}-${kind}`,
        kind === "negative",
      );
    }
  }
}
// Typecheck the actual authored own unit fixtures as well, not just API vectors.
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
      files: [join(own, "fixtures.ts"), join(own, "policy.test.ts")],
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
  `Strict source/own-emitted TS6+5.9 pass; ${expected} meaningful negative lines per compiler/mode; own unit fixtures typed (${relative(root, directory)})`,
);
