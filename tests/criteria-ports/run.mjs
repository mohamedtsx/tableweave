// DEFERRED final-phase units only. No root build/install/package discovery claim.
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
  "Use a fresh final-phase label",
);
await mkdir(join(own, ".artifacts"), { recursive: true });
const output = join(own, ".artifacts", label);
await mkdir(output, { recursive: false });
const requireVite = createRequire(
  await realpath(join(root, "node_modules/vite/package.json")),
);
const result = await requireVite("esbuild").build({
  entryPoints: [join(own, "capture.test.ts")],
  outdir: output,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  metafile: true,
  plugins: [
    {
      name: "actual-installed-data-dependencies",
      setup(builder) {
        builder.onResolve({ filter: /^[^./]/ }, async (args) => {
          if (args.path.startsWith("node:"))
            return { path: args.path, external: true };
          if (args.pluginData?.resolved) return;
          assert(
            ["valibot", "@internationalized/date"].includes(args.path),
            `No runtime React/component import: ${args.path}`,
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
const graph = Object.keys(result.metafile.inputs);
assert(
  !graph.some((path) =>
    /packages\/heroui\/src\/(?!filters\/criteria-ports\.ts)/.test(path),
  ),
  "Only the new helper may execute from HeroUI source",
);
await writeFile(
  join(output, "graph.json"),
  JSON.stringify(result.metafile.inputs, null, 2),
);
const run = spawnSync(
  process.execPath,
  ["--test", join(output, "capture.test.mjs")],
  {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  },
);
await writeFile(join(output, "tests.log"), run.stdout + run.stderr);
console.log(run.stdout + run.stderr);
assert.equal(
  run.status,
  0,
  "Keep failed evidence; do not call authored tests passing",
);
