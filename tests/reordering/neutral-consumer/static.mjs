import fs from "node:fs";
import ts from "typescript";
import { added, leased } from "./scope.mjs";
const source = new Map(
  [...leased, ...added].map((p) => [p, fs.readFileSync(p, "utf8")]),
);
const file = (suffix) => source.get(`packages/heroui/src/${suffix}`);
const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
for (const [p, text] of source) {
  const ast = ts.createSourceFile(
    p,
    text,
    ts.ScriptTarget.Latest,
    true,
    p.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  assert(ast.parseDiagnostics.length === 0, `Syntax ${p}`);
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      assert(
        !["begin", "onSubmit"].includes(node.expression.name.text),
        `Held row terminal invocation in ${p}`,
      );
    }
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      assert(
        !/@dnd-kit|sortable/.test(node.moduleSpecifier.text),
        `Vendor edge ${p}`,
      );
    ts.forEachChild(node, visit);
  };
  visit(ast);
  const before = leased.includes(p)
    ? fs.readFileSync(
        `tests/reordering/neutral-consumer/preimages/${p.replaceAll("/", "__")}.preimage`,
        "utf8",
      )
    : "";
  for (const name of [
    "querySelector",
    "cloneNode",
    "getBoundingClientRect",
    "appendChild",
    "localStorage",
    "createRowMoveCoordinator",
  ])
    assert(
      text.split(name).length <= before.split(name).length,
      `New forbidden native/state engine ${p}: ${name}`,
    );
}
const renderer = file("table/renderer-commit.ts");
const capture = renderer.slice(renderer.indexOf("  capture(input: unknown)"));
assert(
  capture.indexOf("captureTableReordering(") <
    capture.indexOf('this.data(source, "locale"'),
  "Reorder auth precedes private locale capture",
);
const host = file("data-table/host.tsx");
assert(
  host.includes('"reordering"') &&
    host.includes('"handleColumnId"') &&
    host.includes('"onSubmit"'),
  "Host fixed top/nested captures",
);
assert(
  host.indexOf("<TableReorderingHost") < host.indexOf("<CommittedShell"),
  "Registration host outside held shell",
);
const native = file("table/native-collection.tsx"),
  controlled = file("table/controlled-collection.tsx"),
  binding = file("table/reordering-binding.ts");
assert(
  native.includes("refPass,") && native.includes("projectTableReordering("),
  "Real projection depends on local ref pass",
);
assert(
  controlled.includes("captureCollectionReordering(props,") &&
    controlled.includes("reordering?.scope") &&
    controlled.includes("collectionRowRef(reordering, row.id)") &&
    controlled.includes("move?.ref"),
  "Exact lower envelope and direct table/tr/th refs",
);
const controls = file("table/reordering-controls.tsx");
const controlsAST = ts.createSourceFile(
  "controls.tsx",
  controls,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
for (const declaration of controlsAST.statements)
  if (
    ts.isInterfaceDeclaration(declaration) &&
    declaration.name.text === "ColumnMoveProps"
  ) {
    assert(
      !declaration.members.some(
        (member) =>
          ts.isPropertySignature(member) &&
          member.name?.getText(controlsAST) === "handle",
      ),
      "No arbitrary application ref callback widget prop",
    );
  }
assert(
  binding.includes("const presentations = new WeakMap") &&
    controls.includes("collectionReorderingPresentation(props.collection)"),
  "Widget presentation issuance before private widget fields",
);
assert(
  controlled.indexOf("<ColumnMoveControls") <
    controlled.indexOf("{column.isSelection && mode"),
  "Column handle sibling before existing sort content",
);
assert(
  binding.includes('if (status === "refresh-refs")') &&
    binding.includes("record.collection = null;") &&
    /ready:\s*status === "ready"/.test(binding),
  "Consumed ref pass; incomplete has no update loop",
);
assert(
  binding.includes("identity(columns) !== record.columns") &&
    binding.includes("identity(rows) !== record.rows"),
  "Exact weak projection identity",
);
const bindingAST = ts.createSourceFile(
  "binding.ts",
  binding,
  ts.ScriptTarget.Latest,
  true,
);
for (const node of bindingAST.statements)
  if (ts.isInterfaceDeclaration(node)) {
    for (const member of node.members)
      if (ts.isPropertySignature(member) && member.type)
        assert(
          !/DataTableModel|NativeTableView|NativeRow</.test(
            member.type.getText(bindingAST),
          ),
          "No model/native-row backup in binding registry",
        );
  }
assert(
  binding.includes("if (!record.config.rows) return null;"),
  "Column-only has no row navigation receipt",
);
const pager = file("pagination/Pagination.tsx");
const disabled = pager.indexOf("props.schema.pagination.enabled === false");
const interlockCapture = pager.search(/captureReorderingProp\(\s*props\s*,/);
assert(
  disabled >= 0 && interlockCapture > disabled,
  "Disabled pager before any new prop capture",
);
assert(
  pager.includes('Object.getOwnPropertyDescriptor(props,"authority")') ||
    pager.includes('Object.getOwnPropertyDescriptor(props, "authority")'),
  "Bound authority own-data capture",
);
const navigate = binding.slice(
  binding.indexOf("export function navigateTable"),
);
const initialGate = navigate.search(
  /let current = requireTableNavigation\(token,\s*authority\)/,
);
assert(
  initialGate >= 0 &&
    initialGate < navigate.indexOf("pageSize = Number(value)"),
  "Origin gate before coercion",
);
assert(
  /requireTableNavigation\(token,\s*authority\);\s*C.dispatch/.test(binding),
  "Final nav gate immediately before genuine C dispatch",
);
const correction = file("pagination/usePaginationCorrection.ts");
assert(
  correction.indexOf("if (paginationEnabled && interlock !== undefined)") <
    correction.indexOf("captureCorrectionOrigin<S, T>(context)"),
  "Enabled interlock authentication precedes private correction capture",
);
assert(
  /gate\(\);\s*attempted.current =/.test(correction),
  "Blocked correction never spends an attempt",
);
console.log(
  `Own static AST/syntax and bounded contract checks: ${source.size} source files. Not runtime proof.`,
);
