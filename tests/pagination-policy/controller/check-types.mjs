import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { own, root } from "./guard.mjs";

const run = process.env.U1_TYPES_RUN ?? "types";
assert(/^[a-z][a-z0-9-]*$/.test(run));
const output = join(own, ".artifacts", run);
await mkdir(output, { recursive: true });
const template = await readFile(join(own, "types.ts"), "utf8");
const negativeCount = [...template.matchAll(/@ts-expect-error/g)].length;
assert.equal(negativeCount, 14);
const results = [];
async function tsc(compiler, config, label, negative = false) {
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
  if (negative) {
    assert.notEqual(result.status, 0);
    const diagnostics = [
      ...result.stdout.matchAll(/negative\.ts\((\d+),\d+\): error TS(\d+):/g),
    ];
    assert.equal(
      new Set(diagnostics.map((d) => d[1])).size,
      negativeCount,
      result.stdout,
    );
    assert(
      diagnostics.every((d) => ["2322", "2345", "2353", "2540"].includes(d[2])),
      result.stdout,
    );
    assert(!/error TS(?:2307|7016|2688|2578)/.test(result.stdout));
    results.push({
      compiler,
      label,
      negativeLines: negativeCount,
      codes: [...new Set(diagnostics.map((d) => d[2]))],
    });
  } else {
    assert.equal(result.status, 0, result.stdout + result.stderr);
    results.push({ compiler, label, passed: true });
  }
}
for (const compiler of ["typescript", "typescript-5-9"]) {
  const emitted = join(own, ".artifacts", `emitted-${compiler}`);
  const emitConfig = join(output, `${compiler}-emit.json`);
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
          join(root, "packages/react/src/controller/store.ts"),
          join(root, "packages/react/src/contracts/index.ts"),
          join(root, "packages/react/src/filters/registry.ts"),
        ],
      },
      null,
      2,
    ),
  );
  await tsc(compiler, emitConfig, "emit");
  for (const mode of ["source", "emitted"]) {
    const folder = join(output, `${compiler}-${mode}`);
    await mkdir(folder, { recursive: true });
    const input = template.replaceAll(
      "../../../packages/react/src/",
      `${mode === "source" ? join(root, "packages/react/src") : emitted}/`,
    );
    for (const negative of [false, true]) {
      const kind = negative ? "negative" : "positive",
        file = join(folder, `${kind}.ts`);
      await writeFile(
        file,
        negative ? input.replace(/^.*@ts-expect-error.*$/gm, "") : input,
      );
      const config = join(folder, `${kind}.json`);
      await writeFile(
        config,
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
      await tsc(compiler, config, `${mode}-${kind}`, negative);
    }
  }
  const config = join(output, `${compiler}-own-tests.json`);
  await writeFile(
    config,
    JSON.stringify(
      {
        extends: join(root, "tsconfig.base.json"),
        compilerOptions: {
          noEmit: true,
          allowJs: true,
          checkJs: false,
          lib: ["ES2022", "ES2023.Intl"],
          types: ["node"],
          typeRoots: [join(root, "node_modules/@types")],
        },
        files: [
          join(own, "fixtures.ts"),
          join(own, "baseline.test.ts"),
          join(own, "policy.test.ts"),
          join(own, "regressions.test.ts"),
        ],
      },
      null,
      2,
    ),
  );
  await tsc(compiler, config, "own-tests");
}
await writeFile(join(output, "results.json"), JSON.stringify(results, null, 2));
console.log(
  `Both strict compilers/source/own-emitted + authored tests pass; ${negativeCount} meaningful negative lines x4 =${negativeCount * 4}`,
);
