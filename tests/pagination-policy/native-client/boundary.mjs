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
const output = join(own, ".artifacts");
await mkdir(output, { recursive: true });
const tool = createRequire(
  await realpath(join(root, "node_modules/vite/package.json")),
);
const vendor = createRequire(join(root, "packages/react/package.json"));
const exports = [
  ["tanstack/definition.js", ["defineNativeTable", "createNativeController"]],
  ["tanstack/adapter.js", ["createNativeAdapter"]],
  ["tanstack/boundary.js", ["createNativeBoundary"]],
  ["contracts/schema.js", ["defineQuerySchema"]],
  ["contracts/query.js", ["createQuery"]],
];
const contents = exports
  .map(
    ([path, names]) =>
      `export {${names.join(",")}} from ${JSON.stringify(join(root, "packages/react/src", path))};`,
  )
  .join("\n");
const outfile = join(output, `native-${lane}.mjs`);
const built = await tool("esbuild").build({
  stdin: {
    contents,
    loader: "ts",
    sourcefile: "u2-native-entry.ts",
    resolveDir: root,
  },
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  metafile: true,
  plugins: [
    {
      name: "actual-declaring-package-dependencies",
      setup(builder) {
        builder.onResolve({ filter: /^[^./]/ }, async (args) => {
          if (args.pluginData?.resolved) return;
          assert(
            [
              "@tanstack/react-table",
              "@tanstack/table-core/reactivity",
              "@tanstack/table-core/store-reactivity-bindings",
              "valibot",
              "@internationalized/date",
              "react",
            ].includes(args.path),
            args.path,
          );
          const resolved = await builder.resolve(args.path, {
            kind: "import-statement",
            resolveDir: join(root, "packages/react"),
            pluginData: { resolved: true },
          });
          assert.equal(resolved.errors.length, 0);
          return { path: await realpath(resolved.path), external: true };
        });
      },
    },
  ],
});
const graph = Object.fromEntries(
  Object.entries(built.metafile.inputs)
    .filter(([p]) => p !== "u2-native-entry.ts")
    .map(([p, meta]) => {
      assert(p.startsWith("packages/react/src/"));
      assert(!p.includes("/dist/"));
      return [p, meta.imports];
    }),
);
if (lane === "after")
  assert.deepEqual(
    graph,
    JSON.parse(await readFile(join(output, "graph-before.json"), "utf8")).graph,
  );
await writeFile(
  join(output, `graph-${lane}.json`),
  JSON.stringify(
    {
      graph,
      sourceModules: Object.keys(graph).length,
      bundleSha256: hash(await readFile(outfile)),
      vendor: {
        tanstack: await realpath(vendor.resolve("@tanstack/react-table")),
        core: await realpath(vendor.resolve("@tanstack/table-core")),
      },
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
const m=await import(${JSON.stringify(pathToFileURL(outfile).href)});
const schema=m.defineQuerySchema({id:'u2-bare',version:1,pagination:{enabled:false},fields:{amount:{type:'number',owner:'builder',sort:true}}});
const definition=m.defineNativeTable({schema,getRowId:r=>r.id,columns:[{id:'amount',accessorKey:'amount'}]});
const query=m.createQuery(schema,{locale:'en-US',timeZone:'UTC',sorting:[{id:'amount',desc:true}]});
const controller=m.createNativeController(definition,{initial:{query},now:()=>0});
const boundary=m.createNativeBoundary(definition,controller);const records=Array.from({length:173},(_,i)=>({id:String(i),amount:i}));
const frame=boundary.prepare({mode:'client',records},controller.getSnapshot());boundary.commit(frame);const view=boundary.getView(frame);
assert.equal(view.rows.length,${lane === "before" ? 10 : 173});assert.equal(view.rows[0].id,'172');assert.equal(view.rows[0].original,records[172]);
${lane === "after" ? "assert.equal(view.pagination.enabled,false);assert.equal(view.pagination.pageCount,null);" : ""}
console.log('Bare Node actual native boundary + TanStack construction passed; React/TanStack dependencies are expected, no DOM rendering/SSR lifecycle claim.');
`,
  ],
  {
    encoding: "utf8",
    env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  },
);
await writeFile(join(output, `bare-${lane}.log`), smoke.stdout + smoke.stderr);
assert.equal(smoke.status, 0, smoke.stdout + smoke.stderr);
console.log(
  `${lane}: ${Object.keys(graph).length} actual source modules + actual external React/TanStack; bare native creation passed`,
);
