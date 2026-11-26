// FINAL-PHASE ONLY. Does not install or build shared packages.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = fileURLToPath(new URL("./", import.meta.url));
const label = process.argv[2];
assert(
  label && /^[a-z][a-z0-9-]*$/.test(label),
  "Supply a fresh final-phase label",
);
const output = join(own, ".artifacts", label);
await mkdir(join(own, ".artifacts"), { recursive: true });
await mkdir(output, { recursive: false });
const requireVite = createRequire(
  await realpath(join(root, "node_modules/vite/package.json")),
);
const built = await requireVite("esbuild").build({
  entryPoints: [join(own, "regression.test.ts")],
  outdir: output,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  metafile: true,
  plugins: [
    {
      name: "installed-declaring-dependencies",
      setup(builder) {
        builder.onResolve({ filter: /^[^./]/ }, async (args) => {
          if (args.path.startsWith("node:"))
            return { path: args.path, external: true };
          if (args.pluginData?.resolved) return;
          assert(
            ["valibot", "@internationalized/date"].includes(args.path),
            args.path,
          );
          const found = await builder.resolve(args.path, {
            kind: "import-statement",
            resolveDir: join(root, "packages/react"),
            pluginData: { resolved: true },
          });
          assert.equal(found.errors.length, 0);
          return { path: await realpath(found.path), external: true };
        });
      },
    },
  ],
});
await writeFile(
  join(output, "graph.json"),
  JSON.stringify(built.metafile.inputs, null, 2),
);
const result = spawnSync(
  process.execPath,
  ["--test", join(output, "regression.test.mjs")],
  {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  },
);
await writeFile(join(output, "tests.log"), result.stdout + result.stderr);
console.log(result.stdout + result.stderr);
assert.equal(
  result.status,
  0,
  "Keep failed evidence; fix source/tests before any acceptance",
);
