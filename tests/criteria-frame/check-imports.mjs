import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { own, root } from "./scope.mjs";

// Authored for final verification. Counts describe this real bundle when run,
// never the old plain-criteria graph or a claim of SSR/hydration readiness.
const output = join(own, ".artifacts", "imports");
await mkdir(output, { recursive: true });
const tool = createRequire(
  await realpath(join(root, "node_modules/vite/package.json")),
);
const file = join(output, "entry.mjs");
const contents = `export {createCriteriaFrames,getCriteriaToolOwner,requireCriteriaTool} from ${JSON.stringify(join(root, "packages/react/src/presentation/criteria-frame.ts"))};\nexport {createTableSortFn} from ${JSON.stringify(join(root, "packages/react/src/tanstack/sort.ts"))};`;
const result = await tool("esbuild").build({
  stdin: {
    contents,
    loader: "ts",
    sourcefile: "f1-entry.ts",
    resolveDir: root,
  },
  outfile: file,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  metafile: true,
});
await writeFile(
  join(output, "metafile.json"),
  JSON.stringify(result.metafile, null, 2),
);
const script = `import assert from 'node:assert/strict';assert.equal('window' in globalThis,false);assert.equal('document' in globalThis,false);const mod=await import(${JSON.stringify(pathToFileURL(file).href)});assert.equal(mod.getCriteriaToolOwner({}),null);let callbacks=0;const definition={sort(){callbacks++;return 0},resolveDataValue(value){callbacks++;return value}};const fn=mod.createTableSortFn(definition);assert.equal(callbacks,0);assert(Object.isFrozen(fn));assert(!Object.isFrozen(definition));assert(!Object.isFrozen(definition.sort));console.log('Bare Node import/lookup/helper construction passed; not SSR/frame behavior proof.');`;
const ran = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
});
await writeFile(join(output, "bare-node.log"), ran.stdout + ran.stderr);
assert.equal(ran.status, 0, ran.stdout + ran.stderr);
const runtimeSourceInputs = Object.keys(result.metafile.inputs).filter((path) =>
  path.startsWith("packages/react/src/"),
);
await writeFile(
  join(output, "summary.json"),
  JSON.stringify(
    {
      runtimeSourceInputs,
      sourceInputCount: runtimeSourceInputs.length,
      totalInputCount: Object.keys(result.metafile.inputs).length,
      limits:
        "Bundled import/metadata smoke only; no DOM/SSR/hydration/packed proof",
    },
    null,
    2,
  ),
);
console.log(ran.stdout.trim());
