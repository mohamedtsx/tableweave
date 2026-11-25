import fs from "node:fs";
import ts from "typescript";
import { own, target, check } from "./scope.mjs";
const text = fs.readFileSync(target, "utf8"),
  before = fs.readFileSync(`${own}/receipts/client-owner.before.txt`, "utf8");
const parse = (file, text) =>
  ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx")
      ? ts.ScriptKind.TSX
      : file.endsWith("mjs")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS,
  );
function assert(condition, message) {
  if (!condition) throw Error(message);
}
const source = parse(target, text),
  original = parse(target, before);
assert(source.parseDiagnostics.length === 0, "Corrected syntax");
const imports = (file) =>
  file.statements
    .filter(ts.isImportDeclaration)
    .map((node) => node.getText(file));
assert(
  JSON.stringify(imports(source)) === JSON.stringify(imports(original)),
  "Public import boundary changed",
);
assert(
  !/queueMicrotask|setTimeout|setInterval|requestAnimationFrame|pagehide|addEventListener|\bwindow\b|\bdocument\b|\bdisposed\s*=|\bending\b|@ts-ignore|@ts-nocheck|as unknown as|\bany\b/.test(
    text,
  ),
  "Timer/lifetime/browser/suppression escape",
);
const calls = [];
function visit(node) {
  if (ts.isCallExpression(node)) calls.push(node);
  ts.forEachChild(node, visit);
}
visit(source);
const callsOf = (name) =>
  calls.filter((node) => node.expression.getText(source) === name);
assert(
  callsOf("createExampleOwner").length === 1 &&
    callsOf("minimalTransactionDefinition").length === 1,
  "Real A factory/definition required once",
);
const factory = source.statements.find(
  (node) =>
    ts.isFunctionDeclaration(node) && node.name?.text === "createClientOwner",
);
const rejection = factory.body.statements.find(
  (node) =>
    ts.isIfStatement(node) &&
    node.expression.getText(source) ===
      "app.C.getSnapshot().queryIdentity !== initial.queryIdentity",
);
assert(rejection, "Actual initial identity rejection branch missing");
for (const name of [
  "app.P.dispose",
  "app.remote.resource.dispose",
  "app.numericOptions.source.dispose",
  "app.stringOptions.source.dispose",
  "app.C.dispose",
]) {
  const matched = callsOf(name);
  assert(
    matched.length === 1 &&
      matched[0].pos > rejection.pos &&
      matched[0].end < rejection.end,
    `Disposal outside pre-return rejection: ${name}`,
  );
}
const branch = rejection.getText(source);
assert(
  branch.indexOf('result.status !== "disposed"') <
    branch.indexOf("app.remote.resource.dispose()"),
  "Successful P receipt must precede downstream cleanup",
);
assert(
  text.includes("if (mounted || changingConnection || connectionFailed)") &&
    text.includes("if (mounted !== mount) return;"),
  "Exact/reentrant connection guards missing",
);
assert(
  text.indexOf("mounted = mount;") >
    text.indexOf("const disconnect = app.connect();"),
  "No mounted fiction before actual connect returns",
);
assert(
  text.indexOf(
    "mounted = null;",
    text.indexOf("return () => {", text.indexOf("mounted = mount;")),
  ) < text.lastIndexOf("disconnect();"),
  "Release token must clear before callback",
);
assert(
  callsOf("app.connect").length === 1 && callsOf("app.revoke").length === 2,
  "Exact connection with genuine A error revocation only",
);
const fixtures = fs.readFileSync(`${own}/connection.test.tsx`, "utf8");
assert(
  !/vi\.mock|useFakeTimers|\.skip\(|\.todo\(|createFake|createMock/.test(
    fixtures,
  ),
  "No mocked or skipped connection proof",
);
for (const title of [
  "genuine useDataTable SSR",
  "genuinely delayed retained reattach",
  "stale and duplicate disconnects",
  "terminal application revocation",
  "independent genuine owners",
  "bootstrap identity validation",
])
  assert(fixtures.includes(title), `Missing authored obligation ${title}`);
const config = fs.readFileSync(`${own}/vitest.config.mjs`, "utf8");
assert(
  config.includes('"../wp11-next/vitest.config.mjs"') &&
    config.includes('"tests/workbench/wp11-next/server.test.ts"') &&
    !config.includes('"tests/workbench/wp11-next/client.test.tsx"'),
  "Distinct final case selection required",
);
const light = JSON.parse(fs.readFileSync(`${own}/tsconfig.light.json`));
assert(
  light.extends === "../../../apps/example-next/tsconfig.light.json" &&
    !light.compilerOptions,
  "Preserved strict LIGHT must be inherited without relaxations",
);
for (const file of fs
  .readdirSync(own)
  .filter((name) => /\.(mjs|ts|tsx)$/.test(name))
  .map((name) => `${own}/${name}`))
  assert(
    parse(file, fs.readFileSync(file, "utf8")).parseDiagnostics.length === 0,
    `Fixture syntax ${file}`,
  );
console.log(JSON.stringify(check()));
console.log(
  "Syntax/static receipt placement/token/no-timer/public-import/fixture-selection guards pass. These guards do not execute C/P, React, the source owner or a framework.",
);
