import fs from "node:fs";
import ts from "typescript";
import { own, old, changed, added, verify } from "./scope.mjs";
const read = (file) => fs.readFileSync(file, "utf8");
function demand(value, code) {
  if (!value) throw Error(code);
}
export function source(file) {
  const source = ts.createSourceFile(
    file,
    read(file),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : file.endsWith(".ts")
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS,
  );
  demand(source.parseDiagnostics.length === 0, `Syntax:${file}`);
  return source;
}
const files = [...changed, ...added];
function visit(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = `${directory}/${item.name}`;
    if (item.isDirectory()) {
      if (item.name !== "evidence") visit(file);
    } else if (/\.(?:mjs|ts|json)$/.test(file)) files.push(file);
  }
}
visit(own);
for (const file of files)
  if (file.endsWith(".json")) JSON.parse(read(file));
  else source(file);
for (const file of [...changed, `${old}/lib/runtime.mjs`]) {
  const parsed = source(file);
  for (const node of parsed.statements) {
    demand(
      ts.isImportDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isVariableStatement(node),
      `Inert import:${file}`,
    );
    if (ts.isVariableStatement(node))
      for (const item of node.declarationList.declarations) {
        function calls(value) {
          if (
            !value ||
            ts.isArrowFunction(value) ||
            ts.isFunctionExpression(value)
          )
            return;
          demand(!ts.isCallExpression(value), `Top-level effect:${file}`);
          ts.forEachChild(value, calls);
        }
        calls(item.initializer);
      }
  }
  demand(
    !/process\.argv|\b(?:rmSync|unlinkSync|rmdirSync|execSync|eval)\s*\(/.test(
      read(file),
    ),
    `No helper argv/delete/eval:${file}`,
  );
}
for (const [file, entry] of [
  [`${old}/fixtures/family-runtime.mjs`, "run"],
  [`${old}/fixtures/start-host.mjs`, "serveBuilt"],
]) {
  const parsed = source(file);
  let entryCalls = 0;
  for (const node of parsed.statements) {
    if (ts.isIfStatement(node)) {
      demand(
        node.expression.getText(parsed).replaceAll(/\s/g, "") ===
          "process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)",
        `Actual executable guard AST:${file}`,
      );
      function visit(value) {
        if (
          ts.isCallExpression(value) &&
          ts.isIdentifier(value.expression) &&
          value.expression.text === entry
        )
          entryCalls++;
        ts.forEachChild(value, visit);
      }
      visit(node.thenStatement);
      demand(!node.elseStatement, `No unguarded executable else:${file}`);
    } else {
      demand(
        ts.isImportDeclaration(node) ||
          ts.isFunctionDeclaration(node) ||
          ts.isVariableStatement(node),
        `No executable top-level effect:${file}`,
      );
      if (ts.isVariableStatement(node))
        for (const item of node.declarationList.declarations) {
          function calls(value) {
            if (
              !value ||
              ts.isArrowFunction(value) ||
              ts.isFunctionExpression(value)
            )
              return;
            demand(
              !ts.isCallExpression(value),
              `No top-level fixture read/write/spawn:${file}`,
            );
            ts.forEachChild(value, calls);
          }
          calls(item.initializer);
        }
    }
  }
  demand(entryCalls === 1, `One actual guarded executable call:${file}`);
}
for (const name of ["vite", "next", "start"]) {
  const text = read(`${old}/families/${name}.mjs`);
  demand(
    text.includes("return runFamily(ctx)") &&
      !/throw new Error\(\s*"E_HOLD_/.test(text),
    "Real runtime dispatch, not unconditional hold",
  );
  demand(
    text.includes("outputRoots:") &&
      text.includes("candidate: ctx.request.candidate"),
    "Bound actual family build receipt",
  );
}
const runtime = read(`${old}/lib/runtime.mjs`),
  runner = read(`${old}/fixtures/family-runtime.mjs`),
  host = read(`${old}/fixtures/start-host.mjs`),
  generation = read(`${old}/lib/generation.mjs`),
  installer = read(`${old}/lib/installer.mjs`);
for (const token of [
  "E_RUNTIME_INCOMPLETE_REPORT",
  "E_RUNTIME_REPORT_BINDING",
  "E_RUNTIME_FAILURE_OR_CLEANUP_DEBT",
  "E_RUNTIME_EMPTY_OR_DUPLICATE_CASES",
  "E_RUNTIME_NOT_GENUINE_RSC_REJECTION",
  "E_RUNTIME_UNSELECTED_BUILT_FILE",
  "E_RUNTIME_EXPLICIT_PROFILE_NOT_VERIFIED",
  "E_HOLD_RUNTIME_PLAN_SELECTION",
  "E_HOLD_OWNED_BROWSER_SELECTION",
  "E_RUNTIME_ATTEMPT_OVERWRITE",
  "verifyMap(target,browser.files)",
  "toolchain(ctx)",
  "producerInputs(ctx)",
  "installed(ctx)",
])
  demand(
    runtime.replaceAll(" ", "").includes(token.replaceAll(" ", "")),
    `Runtime guard:${token}`,
  );
demand(
  generation.includes('task === "family-runtime"') &&
    generation.includes('args = [path.join(cwd, "wp13-family-runtime.mjs")]') &&
    generation.includes('WP13_RUNTIME_FINAL: "1"'),
  "Fixed phase/command/final runner gate",
);
for (const name of ["family-runtime.mjs", "start-host.mjs"])
  demand(installer.includes(name), "Only fixed runner/host staging");
demand(
  installer.includes("E_RUNTIME_UNSELECTED_OUTPUT") &&
    installer.includes("E_RUNTIME_OUTPUT_SET_DRIFT"),
  "No dropped prepared/output guards",
);
for (const token of [
  "spawn(process.execPath",
  "shell: false",
  "refuseOccupiedPort()",
  "stopOwned(server)",
  "finally",
  "report.cleanupDebt",
  "report.truncated",
  "262144",
  "maxRedirects: 0",
  "routeWebSocket",
  "chromium.launch",
  'freshReadCount: "not-proved"',
])
  demand(
    runner.replaceAll(/\s/g, "").includes(token.replaceAll(/\s/g, "")),
    `Actual runner path:${token}`,
  );
for (const name of ["family-runtime.mjs", "start-host.mjs"]) {
  const text = read(`${old}/fixtures/${name}`);
  demand(
    text.includes(
      "path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)",
    ) ||
      text.includes(
        "path.resolve(process.argv[1])===fileURLToPath(import.meta.url)",
      ),
    "Executable explicit entry guard",
  );
  demand(
    text.includes("process.env.WP13_RUNTIME_FINAL"),
    "FINAL-only executable guard",
  );
}
demand(
  host.includes("dist/server/server.js") &&
    host.includes("entry.fetch(request)") &&
    host.includes("Readable.toWeb(incoming)") &&
    host.includes('duplex: "half"'),
  "Actual built public Start fetch(Request) bridge",
);
for (const token of [
  "next-neutral-flight",
  "next-independent-reattach",
  "next-headless",
  "next-rsc-rejection",
  "start-neutral-canaries",
  "start-hydrated-query",
  "vite-dom-transition",
  "vite-headless-isolation",
  "vite-computed-style",
])
  demand(
    runtime.includes(token) && runner.includes(token),
    "Shared narrow actual case contract",
  );
for (const file of [...changed, ...added])
  demand(
    !/\b(?:rmSync|unlinkSync|rmdirSync|execSync|eval)\s*\(|shell:\s*true|pkill|PLAYWRIGHT_DOWNLOAD_HOST|executablePath:\s*plan\./.test(
      read(file),
    ),
    `No arbitrary shell/delete/browser selector:${file}`,
  );
console.log(JSON.stringify(verify()));
console.log(
  JSON.stringify({
    status: "static-source-only",
    files: files.length,
    MJS: "untyped, not executed",
    originalStaticDisposition:
      "original unconditional-hold assumption superseded; original bytes retained; not replayed as a current pass",
  }),
);
