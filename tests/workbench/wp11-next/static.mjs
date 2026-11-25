import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { allowed, app } from "./scope.mjs";
function assert(value, message) {
  if (!value) throw Error(message);
}
const parse = (file) =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx")
      ? ts.ScriptKind.TSX
      : file.endsWith("mjs")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS,
  );
const source = (file) => fs.readFileSync(file, "utf8");
for (const file of allowed.filter((file) => /\.(ts|tsx|mjs)$/.test(file)))
  if (fs.existsSync(file))
    assert(parse(file).parseDiagnostics.length === 0, `Syntax ${file}`);
const boundary = parse(`${app}/app/ClientDataTableBoundary.tsx`);
assert(
  ts.isExpressionStatement(boundary.statements[0]) &&
    boundary.statements[0].expression.text === "use client",
  "Client directive must be first",
);
for (const file of [
  `${app}/lib/server-contract.ts`,
  `${app}/lib/payload.ts`,
  `${app}/app/headless/route.ts`,
])
  assert(!source(file).includes('"use client"'), `Plain server module ${file}`);
const publicPlain = {
  "@tableweave/react/contracts": "packages/react/src/contracts/index.ts",
  "@tableweave/react/filters": "packages/react/src/filters/index.ts",
};
const seen = new Set(),
  externals = new Set();
function runtimeImports(file) {
  return parse(file)
    .statements.filter(
      (node) =>
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        !node.isTypeOnly &&
        !node.importClause?.isTypeOnly,
    )
    .filter((node) => {
      const bindings = node.importClause?.namedBindings ?? node.exportClause;
      if (
        bindings &&
        (ts.isNamedImports(bindings) || ts.isNamedExports(bindings)) &&
        !node.importClause?.name &&
        bindings.elements.length &&
        bindings.elements.every((item) => item.isTypeOnly)
      )
        return false;
      return true;
    })
    .map((node) => node.moduleSpecifier.text);
}
function walk(file) {
  if (seen.has(file)) return;
  seen.add(file);
  for (const specifier of runtimeImports(file)) {
    assert(
      !/^(react(?:-dom)?(?:\/|$)|@heroui\/|@tableweave\/heroui|next(?:\/|$))/.test(
        specifier,
      ) && specifier !== "@tableweave/react",
      `Client/styled edge in plain graph: ${file} -> ${specifier}`,
    );
    assert(
      !/\.(css|tsx)$/.test(specifier) &&
        !/\/shared\/(owner|definitions|details|resource|reordering)\.js$/.test(
          specifier,
        ),
      `Owner/JSX/style in plain graph ${specifier}`,
    );
    if (publicPlain[specifier]) {
      walk(publicPlain[specifier]);
      continue;
    }
    if (specifier.startsWith(".")) {
      let resolved = path.normalize(path.join(path.dirname(file), specifier));
      if (resolved.endsWith(".js")) resolved = `${resolved.slice(0, -3)}.ts`;
      assert(fs.existsSync(resolved), `Missing static graph edge ${resolved}`);
      walk(resolved);
    } else {
      externals.add(specifier);
      assert(
        ["valibot", "@internationalized/date"].includes(specifier),
        `Unreviewed external plain edge ${specifier}`,
      );
    }
  }
}
walk(`${app}/app/headless/route.ts`);
for (const file of [
  `${app}/lib/server-contract.ts`,
  `${app}/app/headless/route.ts`,
  `${app}/lib/payload.ts`,
]) {
  const parsed = parse(file);
  assert(
    !/\b(fetch|createExampleOwner|createTableController|createCriteriaPublication|createResourceAdapter)\s*\(/.test(
      parsed.text,
    ),
    `State/transport on own server graph ${file}`,
  );
  for (const node of parsed.statements)
    if (ts.isVariableStatement(node))
      assert(
        (node.declarationList.flags & ts.NodeFlags.Const) !== 0,
        `Mutable module scope ${file}`,
      );
}
const config = source(`${app}/next.config.mjs`);
assert(
  config.includes('resolve(appRoot, "../..")') &&
    config.includes("import.meta.resolve(specifier)") &&
    config.includes("fileURLToPath"),
  "Runtime config must anchor exact public export targets at declaring app",
);
assert(
  !/packages\/|\/src\/|webpack|react\/package\.json|react-dom\/package\.json|resolveExtensions|\*['"]/.test(
    config,
  ),
  "Source/wildcard/Vite-React/webpack runtime escape",
);
assert(
  !/resolveAlias|paths|packages\/|\/src\//.test(
    source("tests/workbench/wp11-next/packed/next.config.mjs"),
  ),
  "Packed config must have NO aliases",
);
const runtime = JSON.parse(source(`${app}/tsconfig.json`)),
  light = JSON.parse(source(`${app}/tsconfig.light.json`));
assert(
  !runtime.compilerOptions.paths &&
    light.compilerOptions.noEmit &&
    light.compilerOptions.incremental === false,
  "Runtime/light boundary",
);
for (const value of [runtime, light])
  assert(
    value.extends === "../../tsconfig.base.json" &&
      value.compilerOptions.moduleResolution === "Bundler" &&
      !value.compilerOptions.skipLibCheck &&
      !Object.hasOwn(value.compilerOptions, "exactOptionalPropertyTypes"),
    "Strict base must not be relaxed",
  );
assert(
  !source(`${app}/next-env.d.ts`).includes(".next/"),
  "No fabricated Next generated types",
);
for (const file of allowed.filter((file) => /\.(ts|tsx|mjs)$/.test(file)))
  if (fs.existsSync(file))
    assert(
      !/@ts-ignore|@ts-nocheck|as unknown as|\bany\b|ssr:\s*false|createRoot\(|hydrateRoot\(|\bfetch\(/.test(
        source(file),
      ),
      `Suppression/browser/transport escape ${file}`,
    );
const client = source(`${app}/app/ClientDataTableBoundary.tsx`),
  owner = source(`${app}/lib/client-owner.ts`);
assert(
  client.includes("useDataTable(app.D, app.modelOptions())") &&
    client.includes("initial !== source.initial") &&
    client.includes("app.revoke()"),
  "Actual producer and explicit initial-only boundary required",
);
assert(
  owner.includes("minimalTransactionDefinition()") &&
    owner.includes("createExampleOwner(") &&
    !owner.includes("key="),
  "Real preserved A owner, not controller remount",
);
assert(
  client.includes("<DataTable") &&
    !client.includes("Workbench") &&
    !client.includes("shared/details"),
  "Actual facade; no shared styled host",
);
assert(
  source(`${app}/app/page.tsx`).includes('buildInitialPayload("primary")') &&
    source(`${app}/app/headless/route.ts`).includes(
      "buildInitialPayload(instance)",
    ),
  "Same actual pure builder in RSC and GET",
);
console.log(
  `Static syntax/layer/directive/DTO-source/config guards pass; plain repository graph${seen.size} modules, external declared edges ${[...externals].sort().join(", ")}. No module/config/framework execution; external runtime and bundler resolution are NOT proven.`,
);
