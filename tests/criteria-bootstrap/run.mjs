import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { hash, own, root } from "./guard.mjs";

const label = process.argv[2];
assert(/^[a-z][a-z0-9-]*$/.test(label));
const output = join(own, ".artifacts", label);
await mkdir(output, { recursive: false });
const requireVite = createRequire(await realpath(join(root, "node_modules/vite/package.json")));
const files = process.argv.slice(3);
assert(files.length > 0);
const built = await requireVite("esbuild").build({
  entryPoints: files.map((p) => join(own, p)), outdir: output, outExtension: { ".js": ".mjs" },
  bundle: true, platform: "node", format: "esm", target: "node24", metafile: true,
  plugins: [{ name: "actual-declaring-installed-dependencies", setup(builder) {
    builder.onResolve({ filter: /^[^./]/ }, async (args) => {
      if (args.path.startsWith("node:")) return { path: args.path, external: true };
      if (args.pluginData?.resolved) return;
      assert(["@tanstack/react-table", "@tanstack/table-core/reactivity", "@tanstack/table-core/store-reactivity-bindings", "valibot", "@internationalized/date", "react"].includes(args.path), args.path);
      const resolved = await builder.resolve(args.path, { kind: "import-statement", resolveDir: join(root, "packages/react"), pluginData: { resolved: true } });
      assert.equal(resolved.errors.length, 0);
      return { path: await realpath(resolved.path), external: true };
    });
  } }],
});
const graph = built.metafile.inputs;
for (const p of Object.keys(graph)) {
  assert(p.startsWith("packages/react/src/") || p.startsWith("tests/criteria-bootstrap/"), p);
  assert(!/\/(resource\/(adapter|view)\.|hooks\/|tanstack\/hook\.|ui\/)/.test(p), p);
}
const inputHashes = Object.fromEntries(await Promise.all(Object.keys(graph).map(async (p) => [p, hash(await readFile(join(root, p)))])));
await writeFile(join(output, "graph.json"), JSON.stringify(graph, null, 2));
await writeFile(join(output, "input-hashes.json"), JSON.stringify(inputHashes, null, 2));
const result = spawnSync(process.execPath, ["--test", ...files.map((p) => join(output, p.replace(/\.ts$/, ".mjs")))], { cwd: root, encoding: "utf8", env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" } });
await writeFile(join(output, "tests.log"), result.stdout + result.stderr);
await writeFile(join(output, "result.json"), JSON.stringify({ status: result.status, classification: label.startsWith("naive") ? "expected-loss negative control, not producer failure" : "application source-unit proof", graphModules: Object.keys(graph).length, inputAggregate: hash(JSON.stringify(inputHashes)), outputHashes: Object.fromEntries(await Promise.all(Object.keys(built.metafile.outputs).map(async (p) => [p, hash(await readFile(join(root, p)))]))) }, null, 2));
console.log(result.stdout + result.stderr);
assert.equal(result.status, 0, "Failed run preserved under unique label");
