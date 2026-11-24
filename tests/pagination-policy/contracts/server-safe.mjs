import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { own, root } from "./guard.mjs";

const before = process.argv[2] === "--before";
assert(before || process.argv[2] === "--after");
const tools = createRequire(
  await realpath(join(root, "node_modules/vite/package.json")),
);
const { build } = tools("esbuild");
const directory = join(
  own,
  ".artifacts",
  before ? "server-safe-before" : "server-safe-after",
);
await mkdir(directory, { recursive: true });
const output = join(directory, "contracts.mjs");
const result = await build({
  entryPoints: [join(root, "packages/react/src/contracts/index.ts")],
  outfile: output,
  bundle: true,
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
          const physical = await realpath(resolved.path);
          assert(
            ["valibot", "@internationalized/date"].includes(args.path),
            `Unexpected server dependency: ${args.path}`,
          );
          const declaredPackage = await realpath(
            join(root, "packages/react/node_modules", args.path),
          );
          assert(
            physical.startsWith(`${declaredPackage}/`),
            `Dependency did not resolve from its actual declaring package: ${physical}`,
          );
          return { path: physical, external: true };
        });
      },
    },
  ],
});
const graph = Object.fromEntries(
  Object.entries(result.metafile.inputs).map(([file, info]) => {
    assert(
      file.includes("/packages/react/src/") ||
        file.startsWith("packages/react/src/"),
      `Non-source bundled input: ${file}`,
    );
    assert(
      !/\/(?:controller|hooks|tanstack|resource|presentation)\//.test(file),
    );
    return [file, info.imports];
  }),
);
const externals =
  result.metafile.outputs[output]?.imports ??
  Object.values(result.metafile.outputs)[0]?.imports;
assert(
  externals?.length,
  "Do not falsely claim original dependencies disappeared",
);
assert(
  !/react-dom|react\/|heroui|tanstack|resource|presentation/.test(
    JSON.stringify(externals),
  ),
);
if (!before) {
  const old = JSON.parse(
    await readFile(
      join(own, ".artifacts/server-safe-before/graph.json"),
      "utf8",
    ),
  );
  assert.deepEqual(
    graph,
    old.graph,
    "Server-safe source import graph increased/changed",
  );
  assert.deepEqual(externals, old.externals);
}
await writeFile(
  join(directory, "graph.json"),
  JSON.stringify(
    { graph, externals, sourceFiles: Object.keys(graph).length },
    null,
    2,
  ),
);
const smoke = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `
import assert from "node:assert/strict";
const contracts = await import(${JSON.stringify(pathToFileURL(output).href)});
assert.equal(typeof globalThis.window,"undefined");
const schema=contracts.defineQuerySchema({id:"bare-pagination",version:1,fields:{},${before ? "" : "pagination:{enabled:false},"}});
const query=contracts.createQuery(schema,{locale:"en-US",timeZone:"UTC"});
assert.deepEqual(query.pagination,{pageIndex:0,pageSize:10});
${before ? "" : "assert.equal(schema.pagination.enabled,false); assert.equal(contracts.parseQuery(schema,{...query,pagination:{pageIndex:1,pageSize:10}}).success,false);"}
console.log("Own source bundle bare Node import passed; no React/UI/native/resource imports");
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
  `${before ? "Original" : "Updated"} server-safe graph: ${Object.keys(graph).length} actual source files; dependencies retained, no graph increase`,
);
