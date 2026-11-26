import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { own, requireProtected, root } from "./protect.mjs";

// Authored for main's FINAL verification phase; do not run during authoring.
const label = process.argv[2];
assert(/^[a-z][a-z0-9-]*$/.test(label));
const output = join(own, ".artifacts", label);
await mkdir(output, { recursive: false });
await requireProtected();
const requireRoot = createRequire(join(root, "package.json"));
const requireVite = createRequire(await realpath(join(root, "node_modules/vite/package.json")));
const entry = join(own, "locales.test.ts"), outfile = join(output, "locales.test.mjs");
await requireVite("esbuild").build({
  entryPoints: [entry], outfile, bundle: true, platform: "node", format: "esm", target: "node24",
  define: { "import.meta.url": JSON.stringify(pathToFileURL(entry).href) },
  plugins: [{ name: "only-local-data-plus-node-and-installed-typescript", setup(builder) {
    builder.onResolve({ filter: /^[^./]/ }, (args) => {
      if (args.path.startsWith("node:")) return { path: args.path, external: true };
      assert.equal(args.path, "typescript");
      return { path: requireRoot.resolve("typescript"), external: true };
    });
  } }],
});
const result = spawnSync(process.execPath, ["--test", outfile], {
  cwd: root, encoding: "utf8", env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
});
await writeFile(join(output, "tests.log"), result.stdout + result.stderr);
await writeFile(join(output, "result.json"), JSON.stringify({ status: result.status, classification: "localization source data/template unit proof only" }, null, 2));
console.log(result.stdout + result.stderr);
await requireProtected();
assert.equal(result.status, 0);
