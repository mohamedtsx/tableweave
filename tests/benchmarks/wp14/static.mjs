import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";
import { root, own, files } from "./scope.mjs";
const sources = (await files(own)).filter(
  (file) => !file.startsWith(`${own}evidence/`) && /\.(ts|tsx|mjs)$/.test(file),
);
for (const path of sources) {
  const text = await readFile(resolve(root, path), "utf8"),
    file = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith(".tsx")
        ? ts.ScriptKind.TSX
        : path.endsWith(".ts")
          ? ts.ScriptKind.TS
          : ts.ScriptKind.JS,
    );
  assert.equal(file.parseDiagnostics.length, 0, path);
  if (/\.tsx?$/.test(path))
    assert(
      !/as unknown as|\bas any\b|@ts-ignore|@ts-expect-error|\b(?:it|test)\.(?:skip|only|todo)\b/.test(
        text,
      ),
      path,
    );
  for (const node of file.statements)
    if (ts.isImportDeclaration(node)) {
      const name = node.moduleSpecifier.text;
      assert(
        !name.startsWith("@dnd") && name !== "@tableweave/heroui/sortable",
        path,
      );
    }
  if (/\/(candidate|statistics)\.mjs$/.test(path)) {
    for (const statement of file.statements)
      assert(
        !ts.isExpressionStatement(statement) && !ts.isIfStatement(statement),
        `${path}: helper import action`,
      );
  }
  if (/\/(driver|report)\.mjs$/.test(path))
    assert(text.includes("fileURLToPath(import.meta.url)"), path);
}
const read = async (name) => readFile(resolve(root, own, name), "utf8");
const source = await read("source.ts"),
  timing = await read("timing.ts"),
  view = await read("Benchmark.tsx"),
  driver = await read("driver.mjs"),
  config = await read("vite.config.ts");
const main = await read("main.tsx");
const mainAst = ts.createSourceFile(
  "main.tsx",
  main,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const positions = new Map();
let keyedMount = false;
function inspectMain(node) {
  if (ts.isCallExpression(node)) {
    const name = node.expression.getText(mainAst);
    if (["timing.arm", "define", "createSource"].includes(name)) {
      const at = positions.get(name) ?? [];
      at.push(node.getStart(mainAst));
      positions.set(name, at);
    }
  }
  if (
    ts.isJsxSelfClosingElement(node) &&
    node.tagName.getText(mainAst) === "Benchmark"
  ) {
    keyedMount = node.attributes.properties.some(
      (property) => ts.isJsxAttribute(property) && property.name.text === "key",
    );
  }
  ts.forEachChild(node, inspectMain);
}
inspectMain(mainAst);
for (const name of ["timing.arm", "define", "createSource"])
  assert(positions.get(name)?.length > 0, name);
assert(positions.get("timing.arm")[0] < positions.get("define")[0]);
assert(positions.get("define")[0] < positions.get("createSource")[0]);
assert(keyedMount);
assert(main.includes("E_RESET_DOM_NOT_MATCHED"));
const driverAst = ts.createSourceFile(
  "driver.mjs",
  driver,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
let allowlist;
for (const statement of driverAst.statements)
  if (ts.isVariableStatement(statement))
    for (const declaration of statement.declarationList.declarations)
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "FILES" &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      )
        allowlist = declaration.initializer.elements.map((element) => {
          assert(ts.isStringLiteral(element));
          return element.text;
        });
assert.equal(allowlist.length, 24);
assert.deepEqual(
  (await files(own))
    .filter((path) => !path.startsWith(`${own}evidence/`))
    .map((path) => path.slice(own.length))
    .sort(),
  [...allowlist].sort(),
);
assert(
  source.indexOf("timing.observe(state)") <
    source.indexOf("if (state.queryIdentity !== observedQuery)"),
);
assert(
  source.includes("P.complete(begun.ticket)") &&
    source.indexOf("records = mode ===") >
      source.indexOf("P.complete(begun.ticket)"),
);
assert(
  source.includes("resource.succeed(started.request") &&
    source.includes("getControlsRequestBinding") &&
    source.includes('P.dispose().status !== "disposed"'),
);
assert(
  view.includes("requireDataTableModel(model, source.D)") &&
    view.includes("model.view.rows") &&
    view.includes("presentation.displayed.queryIdentity") &&
    view.includes("tbody > tr") &&
    view.includes("dom"),
);
assert(
  timing.includes("performance.now()") &&
    timing.includes("requestAnimationFrame") &&
    timing.includes("MessageChannel") &&
    timing.includes("assertCurrent()"),
);
assert(
  driver.includes("paintReview(ctx, run, built)") &&
    driver.includes("Tracing.dataCollected") &&
    driver.includes("Screenshot") &&
    driver.includes("[34, 33, 33]") &&
    driver.includes('["warmup", 10]'),
);
assert(
  config.includes("6576") &&
    !config.includes("alias:") &&
    config.includes("emptyOutDir: false"),
);
const fixture = ts.createSourceFile(
  "fixture.ts",
  await read("fixture.ts"),
  ts.ScriptTarget.Latest,
  true,
);
const blocked = JSON.parse(await read("evidence/blocked.json"));
assert.equal(blocked.status, "HOLD_USER_DEFERRED");
for (const key of ["samples", "metrics", "dataChecksum", "runner", "candidate"])
  assert.equal(blocked[key], null);
JSON.parse(await read("evidence/runner-input.schema.json"));
let client, server;
for (const node of fixture.statements)
  if (ts.isInterfaceDeclaration(node)) {
    if (node.name.text === "BenchClient") client = node;
    if (node.name.text === "BenchServer") server = node;
  }
assert.equal(client.members.length, 21);
assert.equal(server.members.length, 10);
for (const path of (await files(own)).filter((path) => path.endsWith(".md"))) {
  const markdown = await readFile(resolve(root, path), "utf8");
  for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1];
    assert(
      !/^https?:/.test(target),
      "Own handoff should be portable local links only",
    );
    const full = resolve(root, path, "..", target.split("#")[0]);
    assert(full.startsWith(`${resolve(root, own)}/`));
    await readFile(full);
  }
}
console.log(
  `Static syntax/ownership/timing sites: ${sources.length} authored code files; client20+ID/server30+ID declarations. NOT generated record counts, runtime, checksum, paint or performance proof.`,
);
