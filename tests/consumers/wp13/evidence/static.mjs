import fs from "node:fs";
import ts from "typescript";
import { own, sha, verifyScope } from "./scope.mjs";
const read = (file) => fs.readFileSync(file, "utf8");
function requireFact(value, message) {
  if (!value) throw Error(message);
}
function source(file) {
  const text = read(file);
  const parsed = ts.createSourceFile(
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
  requireFact(parsed.parseDiagnostics.length === 0, `Syntax ${file}`);
  return parsed;
}
const matrix = JSON.parse(read(`${own}/matrix.json`));
for (const name of ["react", "heroui"]) {
  const manifest = JSON.parse(read(`packages/${name}/package.json`));
  requireFact(
    JSON.stringify(manifest.exports) ===
      JSON.stringify(matrix.packages[name].exports),
    `Actual exports ${name}`,
  );
  requireFact(
    JSON.stringify(manifest.sideEffects) ===
      JSON.stringify(matrix.packages[name].sideEffects),
    `Actual styles ${name}`,
  );
  for (const [subpath, required] of Object.entries(
    matrix.packages[name].runtimeRequired,
  )) {
    const file = `packages/${name}/src/${subpath === "." ? "index.ts" : `${subpath.slice(2)}/index.ts`}`,
      parsed = ts.createSourceFile(
        file,
        read(file),
        ts.ScriptTarget.Latest,
        true,
      ),
      exported = [];
    for (const node of parsed.statements)
      if (
        ts.isExportDeclaration(node) &&
        !node.isTypeOnly &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      )
        exported.push(
          ...node.exportClause.elements
            .filter((item) => !item.isTypeOnly)
            .map((item) => item.name.text),
        );
    requireFact(
      required.every((item) => exported.includes(item)),
      `Actual positive runtime API ${file}`,
    );
  }
}
const helper = ts.createSourceFile(
  "helper.ts",
  read("packages/react/src/reordering-controller/index.ts"),
  ts.ScriptTarget.Latest,
  true,
);
const runtime = [],
  types = [];
for (const node of helper.statements)
  if (
    ts.isExportDeclaration(node) &&
    node.exportClause &&
    ts.isNamedExports(node.exportClause)
  )
    for (const item of node.exportClause.elements)
      (node.isTypeOnly || item.isTypeOnly ? types : runtime).push(
        item.name.text,
      );
requireFact(
  runtime.length === 13 &&
    types.length === 13 &&
    JSON.stringify(runtime.sort()) ===
      JSON.stringify([...matrix.helper.runtime].sort()) &&
    JSON.stringify(types.sort()) ===
      JSON.stringify([...matrix.helper.types].sort()),
  "Actual13+13 helper identities",
);
const files = [];
function visit(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = `${directory}/${item.name}`;
    if (item.name === "evidence") continue;
    if (item.isDirectory()) visit(file);
    else files.push(file);
  }
}
visit(own);
for (const file of files) {
  if (/\.json$/.test(file)) JSON.parse(read(file));
  if (/\.(?:mjs|ts|tsx)$/.test(file)) source(file);
}
for (const file of files.filter((file) =>
  /\/(?:lib|families)\/.+\.mjs$/.test(file),
)) {
  const parsed = source(file);
  for (const node of parsed.statements) {
    requireFact(
      ts.isImportDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isVariableStatement(node),
      `Inert module statement ${file}`,
    );
    if (ts.isVariableStatement(node))
      for (const declaration of node.declarationList.declarations) {
        function calls(value) {
          if (
            !value ||
            ts.isArrowFunction(value) ||
            ts.isFunctionExpression(value)
          )
            return;
          if (ts.isCallExpression(value))
            requireFact(
              value.expression.getText(parsed) === "Object.freeze",
              `Top-level helper call ${file}`,
            );
          ts.forEachChild(value, calls);
        }
        calls(declaration.initializer);
      }
  }
  requireFact(
    !/\b(?:rmSync|unlinkSync|rmdirSync|execSync|exec)\s*\(|shell:\s*true|process\.argv/.test(
      read(file),
    ),
    `No deletion/shell/argv helper ${file}`,
  );
}
const build = read(`${own}/lib/generation.mjs`),
  install = read(`${own}/lib/installer.mjs`),
  archive = read(`${own}/lib/archive.mjs`);
requireFact(
  build.includes('"--frozen-lockfile"') &&
    !build.includes('"--no-frozen-lockfile"') &&
    build.includes("E_DIST_NOT_FRESH") &&
    build.includes("E_REPLAY_LOG_EXISTS"),
  "Fixed immutable command recipe",
);
requireFact(
  archive.includes("E_TAR_EXTENSION_HOLD") &&
    archive.includes("E_TAR_PARENT_COLLISION") &&
    archive.includes("BOTH complete member maps validated"),
  "Archive guards",
);
requireFact(
  install.includes("E_HOLD_PROFILE_REQUIRES_MAIN_MANUAL_STAGING") &&
    install.includes("E_LOCK_PACKAGE_BINDING") &&
    install.includes("E_SHARED_MUTABLE_PROFILE_FILE"),
  "Explicit independent installation profile",
);
const ledger = JSON.parse(read(`${own}/fixtures/diagnostics.json`));
requireFact(
  ledger.status === "authored-unverified" && ledger.cases.length > 0,
  "Nonempty authored ledger, no negative proof",
);
for (const file of ["headless.ts", "styled.tsx", "reordering-controller.ts"])
  requireFact(
    !/@ts-(?:ignore|expect-error|nocheck)|as unknown as|\bany\b/.test(
      read(`${own}/fixtures/${file}`),
    ),
    "Positive-only source program",
  );
for (const name of ["vite", "next", "start"])
  requireFact(
    read(`${own}/families/${name}.mjs`).includes("E_HOLD_") &&
      read(`${own}/families/${name}.mjs`).includes("6575"),
    "Honest runtime family holds",
  );
const rac = JSON.parse(read(`${own}/profiles/rac-runtime.json`)),
  expectedRac = JSON.parse(
    read("packages/heroui/compat/rac-table-clone/profile.json"),
  );
requireFact(
  rac.profileId === expectedRac.id &&
    JSON.stringify(rac.companions) === JSON.stringify(expectedRac.assets),
  "Actual five RAC companion hashes",
);
for (const [file, digest] of Object.entries(
  JSON.parse(read(`${own}/profiles/start-sdk-declarations.json`)).assets,
))
  requireFact(
    sha(fs.readFileSync(file)) === digest,
    "Actual SDK asset identity",
  );
console.log(JSON.stringify(verifyScope()));
console.log(
  `Static parse/inert-module/public-export/profile/positive-source guards passed for ${files.length} owned files. NO CLI/helper/framework/test execution; MJS semantics remain untyped.`,
);
