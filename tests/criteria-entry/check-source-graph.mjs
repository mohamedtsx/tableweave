import assert from "node:assert/strict";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runtimeNames, typeNames } from "./api.mjs";
import { explicitEntryExports, plainGraph } from "./graph.mjs";
import { own, root } from "./scope.mjs";

const entry = join(root, "packages/react/src/criteria/index.ts");
const graph = await plainGraph(entry, join(root, "packages/react/src"));
const ast = graph.nodes.get(await realpath(entry)).ast;
assert.deepEqual(explicitEntryExports(ast), {
  runtime: runtimeNames,
  types: typeNames,
});
assert.deepEqual([...graph.nodes.values()].map((value) => value.path).sort(), [
  "controller/criteria-publication.ts",
  "controller/criteria.ts",
  "criteria/index.ts",
]);
const result = {
  status: "PASS static source AST only; modules never imported/executed",
  nodes: [...graph.nodes.values()].map((value) => value.path).sort(),
  nodeCount: graph.nodes.size,
  edges: graph.edges,
  runtimeEdges: graph.edges.length,
  erasedTypeEdges: graph.typeEdges,
  runtimeNames,
  typeNames,
  runtimeImportExecuted: false,
  publicDistProof: false,
};
await mkdir(join(own, ".artifacts"), { recursive: true });
await writeFile(
  join(own, ".artifacts/source-graph.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    { ...result, erasedTypeEdges: graph.typeEdges.length },
    null,
    2,
  ),
);
