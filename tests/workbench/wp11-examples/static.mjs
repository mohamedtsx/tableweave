import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const exact = {
  "apps/examples/vite/": [
    "README.md",
    "headless.html",
    "headless.tsx",
    "index.html",
    "main.tsx",
    "styles.css",
  ],
  "apps/examples/recipes/": [
    "README.md",
    "custom-cells.tsx",
    "custom-filter.tsx",
    "locale-recovery.tsx",
    "row-bulk-actions.tsx",
  ],
  "apps/example-start/src/recipes/wp11/": [
    "README.md",
    "TableRecipe.tsx",
    "query-options.ts",
    "table-owner.ts",
  ],
};
const allowed = new Set([
  "@tableweave/react",
  "@tableweave/react/contracts",
  "@tableweave/react/filters",
  "@tableweave/react/reordering-controller",
  "@tableweave/react/reordering",
  "@tableweave/heroui",
]);
function specifiers(file) {
  const result = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      result.push(node.moduleSpecifier.text);
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    )
      result.push(node.argument.literal.text);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      result.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return result;
}
for (const [directory, names] of Object.entries(exact)) {
  assert.deepEqual(
    (await readdir(resolve(root, directory))).sort(),
    names.sort(),
  );
  for (const name of names.filter((name) => /\.tsx?$/.test(name))) {
    const path = directory + name,
      text = await readFile(resolve(root, path), "utf8"),
      file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    assert.equal(file.parseDiagnostics.length, 0, path);
    assert(
      !/\.repo|storybook\/test|src\/workbench|\.stories|@dnd-kit|\.admission\.begin\(|as unknown as|@ts-ignore|@ts-expect-error|createCriteriaFrames|createDataTableRendererCell|DetailsProvider|RecordDetails|localStorage|sessionStorage|\bfetch\(/.test(
        text,
      ),
      path,
    );
    for (const name of specifiers(file)) {
      if (name.startsWith("@tableweave/"))
        assert(allowed.has(name), `${path} deep import ${name}`);
      assert(
        !name.includes("packages/") &&
          !name.includes("tests/") &&
          !name.endsWith("Workbench.js"),
        path,
      );
    }
  }
}
function configuration(path) {
  const raw = ts.readConfigFile(resolve(root, path), ts.sys.readFile);
  assert.equal(raw.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(
    raw.config,
    ts.sys,
    dirname(resolve(root, path)),
  );
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.options.noEmit, true);
  assert.equal(parsed.options.strict, true);
  assert.equal(parsed.options.exactOptionalPropertyTypes, true);
  assert.equal(parsed.options.skipLibCheck, false);
  return parsed;
}
async function graph(entry, config) {
  const queue = [resolve(root, entry)],
    visited = new Set();
  while (queue.length) {
    const path = queue.pop();
    if (visited.has(path)) continue;
    visited.add(path);
    assert(
      !/heroui|tailwind|storybook|\.css$/i.test(relative(root, path)),
      `Headless/Start forbidden edge ${path}`,
    );
    const text = await readFile(path, "utf8"),
      file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    assert.equal(file.parseDiagnostics.length, 0, path);
    for (const name of specifiers(file)) {
      assert(
        !/heroui|tailwind|storybook|\.css$/i.test(name),
        `Forbidden ${name} in ${path}`,
      );
      const target = ts.resolveModuleName(
        name,
        path,
        config.options,
        ts.sys,
      ).resolvedModule;
      if (target) queue.push(target.resolvedFileName);
      else
        assert(
          !name.startsWith(".") && !name.startsWith("@tableweave/"),
          `Unresolved application edge ${path} -> ${name}`,
        );
    }
  }
  return [...visited].map((path) => relative(root, path)).sort();
}
const vite = configuration("apps/storybook/tsconfig.examples-light.json"),
  start = configuration("apps/example-start/tsconfig.wp11-light.json");
const headlessGraph = await graph("apps/examples/vite/headless.tsx", vite);
const startGraph = await graph(
  "apps/example-start/src/recipes/wp11/TableRecipe.tsx",
  start,
);
const configText = await readFile(
  resolve(root, "apps/storybook/vite.examples.config.ts"),
  "utf8",
);
assert(
  !configText.includes("/src/"),
  "Runtime Vite must not alias library sources",
);
assert(
  configText.includes("port: 6572") &&
    configText.includes("strictPort: true") &&
    configText.includes('createRequire(new URL("./package.json"'),
);
const configFile = ts.createSourceFile(
  "vite.examples.config.ts",
  configText,
  ts.ScriptTarget.Latest,
  true,
);
const entries = configFile.statements
  .flatMap((node) =>
    ts.isVariableStatement(node) ? [...node.declarationList.declarations] : [],
  )
  .find((node) => node.name.getText(configFile) === "entries");
assert(entries?.initializer && ts.isAsExpression(entries.initializer));
const array = entries.initializer.expression;
assert(ts.isArrayLiteralExpression(array));
const mapping = array.elements.map((node) => {
  assert(ts.isArrayLiteralExpression(node) && node.elements.length === 2);
  assert(node.elements.every(ts.isStringLiteral));
  return [null, ...node.elements.map((element) => element.text)];
});
assert.equal(mapping.length, 8);
for (const [, name, target] of mapping) {
  const packageName = name.startsWith("@tableweave/heroui")
    ? "heroui"
    : "react";
  const manifest = JSON.parse(
    await readFile(
      resolve(root, `packages/${packageName}/package.json`),
      "utf8",
    ),
  );
  const suffix = name.replace(`@tableweave/${packageName}`, ""),
    exported = manifest.exports[suffix ? `.${suffix}` : "."];
  assert(exported, `Not a public runtime export ${name}`);
  assert.equal(
    target,
    `${packageName}/${typeof exported === "string" ? exported.slice(2) : exported.import.slice(2)}`,
  );
}
const main = await readFile(
  resolve(root, "apps/examples/vite/main.tsx"),
  "utf8",
);
assert.equal(
  (main.match(/useDetailsAccessory\(model, options\)/g) ?? []).length,
  1,
);
for (const recipe of [
  "custom-cells",
  "row-bulk-actions",
  "custom-filter",
  "locale-recovery",
])
  assert(main.includes(`../recipes/${recipe}.js`));
const startOwner = await readFile(
  resolve(root, "apps/example-start/src/recipes/wp11/table-owner.ts"),
  "utf8",
);
assert(startOwner.includes("input.queryClient.query("));
assert(!startOwner.includes("fetchQuery"));
assert(
  startOwner.includes("pending !== request") &&
    startOwner.includes("getControlsRequestBinding"),
);
assert(
  startOwner.includes("registerParticipant(criteria") &&
    startOwner.includes("retirement:"),
);
const deferred = await readFile(
  resolve(root, "tests/workbench/wp11-examples/browser.spec.ts"),
  "utf8",
);
assert(!/\.skip\(|\.fixme\(/.test(deferred));
console.log(
  JSON.stringify(
    {
      status:
        "Static source/import/declaration graph only; NOT emitted/runtime proof",
      emittedPublicMappings: mapping.map(([, name, target]) => ({
        name,
        target,
      })),
      headlessGraph,
      startGraph,
    },
    null,
    2,
  ),
);
