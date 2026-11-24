import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { hash, own, requireOriginal, root } from "./guard.mjs";

const lane = process.argv[2];
assert(["before", "after"].includes(lane));
if (lane === "before") await requireOriginal();
const tool = createRequire(
    await realpath(join(root, "node_modules/vite/package.json")),
  ),
  art = join(own, ".artifacts"),
  output = join(art, `resource-${lane}.mjs`);
const contents = `export {createResourceAdapter} from ${JSON.stringify(join(root, "packages/react/src/resource/adapter.js"))};\nexport {projectResourceView} from ${JSON.stringify(join(root, "packages/react/src/resource/view.js"))};`;
const built = await tool("esbuild").build({
  stdin: {
    contents,
    loader: "ts",
    sourcefile: "u3-resource-entry.ts",
    resolveDir: root,
  },
  outfile: output,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  metafile: true,
});
const graph = Object.fromEntries(
  Object.entries(built.metafile.inputs)
    .filter(([p]) => p !== "u3-resource-entry.ts")
    .map(([p, meta]) => {
      assert(
        [
          "packages/react/src/resource/adapter.ts",
          "packages/react/src/resource/view.ts",
          "packages/react/src/contracts/json.ts",
          "packages/react/src/contracts/errors.ts",
        ].includes(p),
        p,
      );
      assert(meta.imports.every((edge) => !edge.external));
      return [p, meta.imports];
    }),
);
assert.equal(Object.keys(graph).length, 4);
if (lane === "after")
  assert.deepEqual(
    graph,
    JSON.parse(await readFile(join(art, "graph-before.json"), "utf8")).graph,
  );
await writeFile(
  join(art, `graph-${lane}.json`),
  JSON.stringify(
    {
      graph,
      runtimeSourceModules: 4,
      externalRuntimeDependencies: 0,
      bundleSha256: hash(await readFile(output)),
    },
    null,
    2,
  ),
  lane === "before" ? { flag: "wx" } : {},
);
const script = `
import assert from 'node:assert/strict';
assert.equal('window' in globalThis,false);assert.equal('document' in globalThis,false);
const {createResourceAdapter}=await import(${JSON.stringify(pathToFileURL(output).href)});
const context={definitionKey:'d',scopeKey:'s',access:true}, adapter=createResourceAdapter(context);
const query={version:1,schemaId:'q',schemaVersion:1,locale:'en-US',timeZone:'UTC',builder:{join:'and',rules:[]},search:'',tabId:null,date:null,sorting:[],pagination:{pageIndex:0,pageSize:25}};
const token=adapter.begin({definitionKey:'d',scopeKey:'s',queryKey:'q',requestKey:'r',query,${lane === "after" ? "extent:{kind:'complete'},evaluatedAt:0" : ""}});
const records=Array.from({length:137},(_,i)=>({id:String(i)}));
assert(adapter.succeed(token,{source:'fresh',records,page:{kind:'known',total:137},emptyKind:'unknown',receivedAt:'2026-11-24T00:00:00Z'}));
assert.equal(adapter.getSnapshot().canNavigate,${lane === "after" ? "false" : "true"});
assert.equal(adapter.getSnapshot().canSelect,true);assert.equal(adapter.getSnapshot().snapshot.records[0],records[0]);assert.equal(Object.isFrozen(records[0]),false);
console.log('Bare Node generic resource passed;4 actual source modules, no DOM/React/controller/native/execution runtime dependency.');`;
const result = spawnSync(
  process.execPath,
  ["--input-type=module", "-e", script],
  {
    encoding: "utf8",
    env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  },
);
await writeFile(join(art, `bare-${lane}.log`), result.stdout + result.stderr);
assert.equal(result.status, 0, result.stdout + result.stderr);
console.log(`${lane}:4-module generic runtime graph/bare Node passed`);
