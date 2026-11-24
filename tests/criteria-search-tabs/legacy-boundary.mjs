import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const before = JSON.parse(
  await readFile(new URL("./before.json", import.meta.url), "utf8"),
);
const files = ["filter-search.tsx", "filter-tabs.tsx"];
const record = new URL("./legacy-preimages.json", import.meta.url);
// `capture` is a one-time authoring operation on the unformatted additive patch.
// Normal final-phase use reads the sealed original bodies; never recapture/rebase.
const print = (text, name) => {
  const ast = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn =
    ast.statements.find(
      (node) =>
        ts.isFunctionDeclaration(node) &&
        /^LegacyFilter(?:Search|Tabs)$/.test(node.name?.text ?? ""),
    ) ??
    ast.statements.find(
      (node) =>
        ts.isFunctionDeclaration(node) &&
        /^Filter(?:Search|Tabs)$/.test(node.name?.text ?? ""),
    );
  assert(fn?.body);
  return ts.createPrinter().printNode(ts.EmitHint.Unspecified, fn.body, ast);
};
if (process.argv[2] === "capture") {
  const bodies = {};
  for (const name of files) {
    const path = `packages/heroui/src/toolbar/${name}`;
    let text = await readFile(new URL(path, root), "utf8");
    // Reconstruct the exact pre-edit file from the strictly additive patch and
    // verify against the BEFORE full-file digest, not an invented legacy fixture.
    text = text.replace(
      /^import .*from "(?:\.\.\/filters\/criteria-commit|\.\/criteria-tool-host)\.js";\n/gm,
      "",
    );
    const ast = ts.createSourceFile(
      name,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const publicName =
      name === "filter-search.tsx" ? "FilterSearch" : "FilterTabs";
    const wrapper = ast.statements.find(
      (node) =>
        ts.isFunctionDeclaration(node) && node.name?.text === publicName,
    );
    const legacy = ast.statements.find(
      (node) =>
        ts.isFunctionDeclaration(node) &&
        node.name?.text === `Legacy${publicName}`,
    );
    assert(wrapper && legacy?.body);
    const header =
      publicName === "FilterSearch"
        ? "export function FilterSearch<S extends QuerySchema>(\n  props: FilterSearchProps<S>,\n) {"
        : "export function FilterTabs<S extends QuerySchema>(props: FilterTabsProps<S>) {";
    const original =
      text.slice(0, wrapper.getStart(ast)) +
      header +
      text.slice(legacy.body.getStart(ast) + 1, legacy.end) +
      "\n";
    assert.equal(
      createHash("sha256").update(original).digest("hex"),
      before[path].sha256,
      path,
    );
    bodies[path] = {
      fullOriginalSha256: before[path].sha256,
      normalizedBody: print(original, name),
    };
  }
  const sharedPath = "packages/heroui/src/toolbar/filter-shared.ts";
  const shared = (await readFile(new URL(sharedPath, root), "utf8"))
    .replace(
      'import type { CriteriaToolTarget } from "../filters/criteria-commit.js";\n',
      "",
    )
    .replace(
      "  /** Opt into genuine committed criteria ownership. Omission alone is legacy. */\n  readonly criteria?: CriteriaToolTarget<NoInfer<S>>;\n",
      "",
    );
  assert.equal(
    createHash("sha256").update(shared).digest("hex"),
    before[sharedPath].sha256,
  );
  await writeFile(record, `${JSON.stringify(bodies, null, 2)}\n`, {
    flag: "wx",
  });
  console.log(
    "Exact original full-file preimages verified for all three deltas; raw Search/Tabs body references captured without Git.",
  );
} else {
  const bodies = JSON.parse(await readFile(record, "utf8"));
  for (const [path, value] of Object.entries(bodies)) {
    assert.equal(
      print(await readFile(new URL(path, root), "utf8"), path),
      value.normalizedBody,
      path,
    );
  }
  console.log(
    "Both legacy bodies match their verified pre-edit normalized AST bodies; no runtime code imported/executed.",
  );
}
