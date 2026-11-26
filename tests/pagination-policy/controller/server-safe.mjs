import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { hash, own, requireOriginal, root } from "./guard.mjs";

const lane = process.argv[2];
assert(["before", "after"].includes(lane));
if (lane === "before") await requireOriginal();
const artifacts = join(own, ".artifacts");
await mkdir(artifacts, { recursive: true });
const tool = createRequire(
  await realpath(join(root, "node_modules/vite/package.json")),
);
const { build } = tool("esbuild");
const contents = [
  ["controller/store.js", ["createTableController", "replaceTableDefinition"]],
  ["controller/reducer.js", ["reduceTableState"]],
  ["controller/validation.js", ["ControllerError"]],
  ["contracts/schema.js", ["defineQuerySchema"]],
  ["contracts/query.js", ["createQuery"]],
]
  .map(
    ([path, names]) =>
      `export {${names.join(",")}} from ${JSON.stringify(join(root, "packages/react/src", path))};`,
  )
  .join("\n");
const output = join(artifacts, `server-${lane}.mjs`);
const result = await build({
  stdin: {
    contents,
    sourcefile: "u1-server-entry.ts",
    resolveDir: root,
    loader: "ts",
  },
  outfile: output,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  metafile: true,
  plugins: [
    {
      name: "actual-declaring-package-runtime",
      setup(builder) {
        builder.onResolve({ filter: /^[^./]/ }, async (args) => {
          if (args.pluginData?.resolved) return;
          assert(["valibot", "@internationalized/date"].includes(args.path));
          const resolution = await builder.resolve(args.path, {
            kind: "import-statement",
            resolveDir: join(root, "packages/react"),
            pluginData: { resolved: true },
          });
          assert.equal(resolution.errors.length, 0);
          const path = await realpath(resolution.path);
          assert(
            path.startsWith(
              `${await realpath(join(root, "packages/react/node_modules", args.path))}/`,
            ),
          );
          return { path, external: true };
        });
      },
    },
  ],
});
const graph = Object.fromEntries(
  Object.entries(result.metafile.inputs)
    .filter(([path]) => path !== "u1-server-entry.ts")
    .map(([path, metadata]) => {
      assert(path.startsWith("packages/react/src/"));
      assert(!/\/(hooks|tanstack|resource|presentation|tools)\//.test(path));
      return [path, { imports: metadata.imports, sha256: null }];
    }),
);
if (lane === "after")
  assert.deepEqual(
    graph,
    JSON.parse(await readFile(join(artifacts, "graph-before.json"), "utf8"))
      .graph,
    "Pure import graph/externals must remain unchanged",
  );
await writeFile(
  join(artifacts, `graph-${lane}.json`),
  JSON.stringify(
    {
      graph,
      sourceFiles: Object.keys(graph).length,
      bundleSha256: hash(await readFile(output)),
    },
    null,
    2,
  ),
  lane === "before" ? { flag: "wx" } : {},
);
const smoke = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `
import assert from 'node:assert/strict';
assert.equal('window' in globalThis,false);assert.equal('document' in globalThis,false);
const m=await import(${JSON.stringify(pathToFileURL(output).href)});
const schema=m.defineQuerySchema({id:'u1-bare',version:1,fields:{},pagination:{enabled:false}});
const store=m.createTableController({schema},{initial:{query:m.createQuery(schema,{locale:'en-US',timeZone:'UTC'})},now:()=>0});
assert.equal(store.getSnapshot().query.pagination.pageIndex,0);
${lane === "after" ? "assert.throws(()=>store.dispatch({type:'pagination.change',update:previous=>previous}),e=>e instanceof m.ControllerError&&e.code==='state.capability');" : "assert.equal(store.dispatch({type:'pagination.change',update:previous=>previous}).status,'noop');"}
console.log('Actual source-derived pure controller bundle imports in bare Node; no React/native/browser runtime.');
`,
  ],
  {
    encoding: "utf8",
    env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  },
);
await writeFile(
  join(artifacts, `server-${lane}.log`),
  smoke.stdout + smoke.stderr,
);
assert.equal(smoke.status, 0, smoke.stdout + smoke.stderr);
console.log(
  `${lane}: ${Object.keys(graph).length} source modules; actual declaring-package external deps, bare Node passed`,
);
