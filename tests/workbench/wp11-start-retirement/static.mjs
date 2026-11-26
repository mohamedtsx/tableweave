import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = new URL("../../../", import.meta.url);
const text = await readFile(
  new URL(
    "apps/example-start-facade/src/application/bootstrap-session.ts",
    root,
  ),
  "utf8",
);
const file = ts.createSourceFile(
  "bootstrap-session.ts",
  text,
  ts.ScriptTarget.Latest,
  true,
);
assert.equal(file.parseDiagnostics.length, 0);
let retirement;
function walk(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "retire")
    retirement = node;
  ts.forEachChild(node, walk);
}
walk(file);
assert(retirement?.body);
const body = retirement.body.getText(file),
  firstChild = body.indexOf("for (const child of children)");
assert(firstChild > 0);
const closed = body.slice(0, firstChild);
for (const marker of [
  'phase = "retiring"',
  "lease = null",
  "operation = null",
  "sources = null",
  "receipt = null",
  "stageSnapshot()",
  "pendingPartitions.add(old.id)",
  "pendingCanary = true",
])
  assert(closed.includes(marker), marker);
assert(closed.indexOf("stageSnapshot()") > closed.indexOf("receipt = null"));
assert(!closed.includes("publish()"));
assert(body.indexOf("clearCache()") > firstChild);
assert(body.indexOf("cacheGone()") > body.indexOf("remove()"));
assert(
  body.indexOf("pendingPartitions.clear()") > body.indexOf("if (!complete)"),
);
assert(
  body.indexOf('phase = "ended"') > body.indexOf("pendingPartitions.clear()"),
);
assert(
  text.includes("cache.remove(query)") &&
    text.includes("cache.findAll(filter).length !== 0"),
);
assert(text.includes("client.getQueryCache().findAll(filter).length !== 0"));
assert(
  !/\.C\.dispose\(|\.P\.dispose\(|removeQueries\(|setTimeout|queueMicrotask|as unknown as|as any|@ts-ignore|@ts-expect-error/.test(
    text,
  ),
);
assert(
  text.includes("receipt === boot && lease === origin") &&
    text.includes("lease !== origin"),
);
const config = await readFile(
  new URL("./vitest.config.mjs", import.meta.url),
  "utf8",
);
assert(
  config.includes("tests/workbench/wp11-start-facade/final/contracts.test.ts"),
);
const cases = await readFile(
  new URL("./final/retirement.test.ts", import.meta.url),
  "utf8",
);
assert(!/\b(?:it|test|describe)\.(?:skip|todo|only)\b/.test(cases));
assert(
  cases.includes("session.attach(boot)") &&
    cases.includes("source.P.subscribe") &&
    cases.includes("source.resource.subscribe") &&
    cases.includes("source.C.subscribe"),
);
const raw = ts.readConfigFile(
  fileURLToPath(new URL("./tsconfig.source-light.json", import.meta.url)),
  ts.sys.readFile,
);
assert.equal(raw.error, undefined);
assert.equal(raw.config.compilerOptions, undefined);
console.log(
  "Static AST/source order: closed snapshot before first child callback; independent cleanup/verification and old assertions retained. NOT runtime callback/cache/SSR proof.",
);
