import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import ts from "typescript";
const root = new URL("../../../", import.meta.url);
const shared = "apps/examples/shared/",
  catalog = "apps/storybook/src/workbench/";
const sharedNames = [
  "definitions.ts",
  "details.tsx",
  "options.ts",
  "owner.ts",
  "records.ts",
  "reordering.ts",
  "resource.ts",
  "schemas.ts",
];
assert.deepEqual((await readdir(new URL(catalog, root))).sort(), [
  "Configurations.stories.tsx",
  "Details.stories.tsx",
  "Filters.stories.tsx",
  "Recovery.stories.tsx",
  "Reordering.stories.tsx",
  "Workbench.tsx",
  "scenes.md",
  "tsconfig.light.json",
  "types.ts",
]);
assert.deepEqual((await readdir(new URL(shared, root))).sort(), sharedNames);
const allowed = new Set([
  "@tableweave/react",
  "@tableweave/react/contracts",
  "@tableweave/react/filters",
  "@tableweave/heroui",
  "@tableweave/react/reordering-controller",
  "@tableweave/react/reordering",
]);
const inputs = [
  ...sharedNames.map((name) => `${shared}${name}`),
  ...(await readdir(new URL(catalog, root)))
    .filter((name) => /\.tsx?$/.test(name))
    .map((name) => `${catalog}${name}`),
];
const stories = [];
for (const path of inputs) {
  const text = await readFile(new URL(path, root), "utf8"),
    file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  assert.equal(file.parseDiagnostics.length, 0, path);
  assert(
    !/\.repo|@dnd-kit|tests\/|packages\/.*src|\.admission\.begin\(|createDataTableRendererCell|createCriteriaFrames|RendererTarget|as unknown as|@ts-ignore|@ts-expect-error/.test(
      text,
    ),
    `No private policies/fixtures/adapter escapes in ${path}`,
  );
  for (const node of file.statements) {
    if (ts.isImportDeclaration(node)) {
      const name = node.moduleSpecifier.text;
      if (name.startsWith("@tableweave/"))
        assert(allowed.has(name), `${path}: ${name}`);
      if (
        ["records.ts", "schemas.ts", "definitions.ts"].some(
          (name) => path === shared + name,
        )
      )
        assert(
          !/@heroui|heroui|\.css$/.test(name),
          `Headless fixture imports ${name}`,
        );
    }
  }
  if (!path.endsWith(".stories.tsx")) continue;
  const meta = file.statements
    .flatMap((node) =>
      ts.isVariableStatement(node)
        ? [...node.declarationList.declarations]
        : [],
    )
    .find((node) => node.name.getText(file) === "meta");
  assert(meta);
  const value = ts.isSatisfiesExpression(meta.initializer)
    ? meta.initializer.expression
    : meta.initializer;
  const id = value.properties.find((node) => node.name.getText(file) === "id")
    .initializer.text;
  assert(id.startsWith("wp11-"));
  for (const node of file.statements) {
    if (
      !ts.isVariableStatement(node) ||
      !node.modifiers?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    for (const entry of node.declarationList.declarations) {
      assert(
        ts.isObjectLiteralExpression(entry.initializer),
        "No aliased mock story exports",
      );
      assert(
        entry.initializer.properties.some(
          (item) => item.name.getText(file) === "play",
        ),
        "Each story has a genuine unrun play",
      );
      const name = entry.name.getText(file),
        slug = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      stories.push({
        id: `${id}--${slug}`,
        name,
        source: path,
        status: "authored-unrun",
      });
    }
  }
}
assert.equal(stories.length, 33);
assert.equal(new Set(stories.map((story) => story.id)).size, 33);
const sceneMap = await readFile(new URL(`${catalog}scenes.md`, root), "utf8");
for (const story of stories)
  assert(
    sceneMap.includes(story.id),
    `Missing exact CSF-defined story ID ${story.id}`,
  );
for (const id of Array.from(
  { length: 22 },
  (_, i) => `F-${String(i + 1).padStart(2, "0")}`,
))
  assert(sceneMap.includes(id), id);
const reorder = await readFile(new URL(`${shared}reordering.ts`, root), "utf8");
assert(reorder.includes("helper.admission.commitModel(lease, model)"));
assert(reorder.includes("row.original !== page[index]"));
assert(
  !/\.begin\(/.test(reorder),
  "Only production renderer may begin row operations",
);
const workbench = await readFile(
  new URL(`${catalog}Workbench.tsx`, root),
  "utf8",
);
assert(workbench.includes("useDataTable(app.D, app.modelOptions())"));
assert(!/RecordDetails|DetailsProvider|key=\{.*query/.test(workbench));
assert(
  workbench.includes("storybook") === false,
  "Runtime composition does not import test helpers",
);
const config = JSON.parse(
  await readFile(new URL(`${catalog}tsconfig.light.json`, root), "utf8"),
);
assert.equal(config.compilerOptions.noEmit, true);
assert.equal(config.compilerOptions.skipLibCheck, undefined);
assert.equal(config.compilerOptions.exactOptionalPropertyTypes, undefined);
assert.equal(
  config.compilerOptions.paths["@tableweave/heroui"][0],
  "../../../../packages/heroui/src/index.ts",
);
console.log(
  JSON.stringify(
    {
      evidence:
        "Static source/CSF only; not Storybook index/runtime/package/SSR proof",
      librarySources: "155 remain protected by scope",
      stories,
    },
    null,
    2,
  ),
);
