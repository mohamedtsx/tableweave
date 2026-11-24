import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { own, root, source } from "./guard.mjs";

const tools = createRequire(
  await realpath(join(root, "node_modules/vite/package.json")),
);
const { build } = tools("esbuild");
const directory = join(own, ".artifacts/server-safe");
await mkdir(directory, { recursive: true });
const result = await build({
  entryPoints: {
    contracts: join(root, "packages/react/src/contracts/index.ts"),
    execution: join(root, source),
  },
  outdir: directory,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  splitting: true,
  platform: "node",
  target: "node24",
  format: "esm",
  metafile: true,
  plugins: [
    {
      name: "actual-declaring-package-externals",
      setup(builder) {
        builder.onResolve({ filter: /^[^./]/ }, async (args) => {
          if (args.pluginData?.resolved) return;
          const resolved = await builder.resolve(args.path, {
            kind: "import-statement",
            resolveDir: join(root, "packages/react"),
            pluginData: { resolved: true },
          });
          assert.equal(resolved.errors.length, 0);
          assert(
            ["valibot", "@internationalized/date"].includes(args.path),
            `Unexpected server dependency ${args.path}`,
          );
          const physical = await realpath(resolved.path);
          const declared = await realpath(
            join(root, "packages/react/node_modules", args.path),
          );
          assert(physical.startsWith(`${declared}/`));
          return { path: physical, external: true };
        });
      },
    },
  ],
});
const graph = Object.fromEntries(
  Object.entries(result.metafile.inputs).map(([file, info]) => {
    assert(
      file.startsWith("packages/react/src/") ||
        file.startsWith(`${root}/packages/react/src/`),
    );
    assert(
      !/\/(?:controller|hooks|tanstack|resource|presentation)\//.test(file),
    );
    return [file, info.imports];
  }),
);
const old = JSON.parse(
  await readFile(
    join(
      root,
      "tests/pagination-policy/contracts/.artifacts/server-safe-after/graph.json",
    ),
    "utf8",
  ),
);
const existing = Object.fromEntries(
  Object.entries(graph).filter(
    ([file]) => !file.endsWith("/contracts/execution.ts"),
  ),
);
assert.deepEqual(
  existing,
  old.graph,
  "Existing approved import graph must stay identical",
);
assert.equal(Object.keys(graph).length, old.sourceFiles + 1);
await writeFile(
  join(directory, "graph.json"),
  JSON.stringify(
    {
      graph,
      sourceFiles: Object.keys(graph).length,
      originalFiles: old.sourceFiles,
      onlyAddedSource: source,
      unchangedExistingEdges: true,
    },
    null,
    2,
  ),
);
const contractsUrl = pathToFileURL(join(directory, "contracts.mjs")).href;
const executionUrl = pathToFileURL(join(directory, "execution.mjs")).href;
const smoke = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `
import assert from "node:assert/strict";
const {defineQuerySchema,createQuery}=await import(${JSON.stringify(contractsUrl)});
const {compileQueryExecution}=await import(${JSON.stringify(executionUrl)});
assert.equal(typeof globalThis.window,"undefined");
assert.equal(typeof globalThis.document,"undefined");
const schema=defineQuerySchema({id:"bare-execution",version:1,fields:{},pagination:{enabled:false}});
const query=createQuery(schema,{locale:"en-US",timeZone:"UTC"});
const result=compileQueryExecution(schema,query,{now:0});
assert.equal(result.evaluatedAt,0);
assert.deepEqual(result.extent,{kind:"complete"});
assert.deepEqual(Reflect.ownKeys(result.extent),["kind"]);
assert(Object.isFrozen(result)&&Object.isFrozen(result.query)&&Object.isFrozen(result.filter));
console.log("Bare Node source-derived import passed; no browser globals, UI/React/native/resource dependencies");
`,
  ],
  {
    cwd: own,
    encoding: "utf8",
    env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  },
);
await writeFile(
  join(directory, "bare-import.log"),
  smoke.stdout + smoke.stderr,
);
if (smoke.error) throw smoke.error;
assert.equal(smoke.status, 0, smoke.stdout + smoke.stderr);
console.log(
  `Server-safe graph: ${Object.keys(graph).length} source modules = unchanged approved10 + new execution only`,
);
