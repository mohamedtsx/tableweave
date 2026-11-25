import fs from "node:fs";
import ts from "typescript";
import { leased } from "./scope.mjs";
const root = "tests/reordering/pretoken-renderer";
const parse = (file, text = fs.readFileSync(file, "utf8")) =>
  ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
function assert(value, message) {
  if (!value) throw Error(message);
}
function find(file, name) {
  let found;
  const visit = (node) => {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isVariableDeclaration(node)) &&
      node.name?.getText(file) === name
    )
      found = node;
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert(found, `Missing function ${name}`);
  return found;
}
function calls(file, node) {
  const result = [];
  const visit = (child) => {
    if (ts.isCallExpression(child)) result.push(child.expression.getText(file));
    ts.forEachChild(child, visit);
  };
  visit(node);
  return result;
}
const before = JSON.parse(fs.readFileSync(`${root}/source155-before.json`));
const sources = [...Object.keys(before)];
const parsedSources = sources.filter((file) => /\.[cm]?[jt]sx?$/.test(file));
for (const file of parsedSources) {
  const parsed = parse(file);
  assert(parsed.parseDiagnostics.length === 0, `Syntax ${file}`);
}
const N = parse("packages/heroui/src/table/native-resource-lifetime.ts"),
  R = parse("packages/heroui/src/table/renderer-commit.ts"),
  C = parse("packages/heroui/src/filters/criteria-commit-core.ts"),
  B = parse("packages/heroui/src/table/reordering-binding.ts");
for (const [file, name, allow] of [
  [
    N,
    "revokeAction",
    [
      "actionStates.delete",
      "revokeReorderInteraction",
      "revokeRendererRowPreparation",
    ],
  ],
  [
    R,
    "revokeRendererRowPreparation",
    ["rowPreparations.get", "rowNotifications.get"],
  ],
  [
    B,
    "clearCollection",
    [
      "known",
      "record.rowRefs.clear",
      "record.rowHandles.clear",
      "record.leaves.clear",
      "presentations.delete",
    ],
  ],
])
  assert(
    calls(file, find(file, name)).every((call) => allow.includes(call)),
    `Nonfixed/port work in ${name}`,
  );
const retire = find(B, "retireTableReordering").getText(B);
assert(
  !retire.includes("changed(") && !retire.includes("listener("),
  "Inline retirement observer",
);
assert(
  retire.indexOf("clearCollection(") < retire.indexOf("releaseReorderUI("),
  "Clear owned data before deferred headless release",
);
const body = find(R, "submitRow"),
  text = body.getText(R);
const compact = text.replace(/\s/g, "");
const start = text.indexOf("result = apply(begin"),
  notify = text.indexOf("returned = apply(fn");
assert(
  start >= 0 && notify > start,
  "Missing actual begin/notification transfer",
);
const transfer = text.slice(start, notify);
assert(
  !/require\w*\(|get\w*\(|await|\.then|Reflect\./.test(transfer),
  "Callback/getter/source lookup after started before notify",
);
assert(
  text.indexOf("bindNativeRowAction(") < text.indexOf("admission.capture("),
  "Action reservation must bracket capture reentry",
);
assert(
  text.indexOf("requireNativeRowAction(") < start &&
    text.lastIndexOf("finish();", start) < start,
  "Pre-token native/role fences",
);
assert(
  compact.includes("apply(fn,receiver,[result.operation])"),
  "Exact captured fn/receiver/token transfer",
);
assert(
  !text.includes("settle(") && !text.includes("acknowledge("),
  "Renderer may not invent an app/backend result",
);
const config = find(B, "captureTableReordering").getText(B);
const compactConfig = config.replace(/\s/g, "");
assert(
  !config.includes("wrapNotification") &&
    config.includes("captureRendererRowNotification"),
  "No application notification factory/checker parameter",
);
assert(
  compactConfig.indexOf("if(view&&model.frame") >= 0 &&
    compactConfig.indexOf("if(view&&model.frame") <
      compactConfig.indexOf("joinReorderModel("),
  "Source-only input cannot call a display join",
);
assert(
  config.includes("suspendReorderUI(ui)"),
  "Preflight must suspend its association, never publish a fake actor",
);
const nav = find(B, "navigateTable").getText(B);
for (const match of nav.matchAll(/Number\(value\);/g))
  assert(
    /^\s*requireTableNavigation\(token,\s*authority\);/.test(
      nav.slice(match.index + match[0].length),
    ),
    "Coercion must immediately recheck original navigation",
  );
const oldCore = parse(
  C.fileName,
  fs.readFileSync(
    `${root}/preimages/${C.fileName.replaceAll("/", "__")}.preimage`,
    "utf8",
  ),
);
const nativeAdds = [
  ...C.getText().matchAll(/native\?\.revokeAction\(\);[^\n]*/g),
];
assert(
  C.getText().replace(/^.*native\?\.revokeAction\(\);[^\n]*\n/gm, "") ===
    oldCore.getText(),
  "Core's only delta must be the three closed native-only action cuts (tool/details/SKIP unchanged)",
);
assert(
  nativeAdds.length === 3,
  "Closed renderer-only commit/update/disconnect action cuts",
);
for (const name of [
  "cancel",
  "cancelAll",
  "schedule",
  "invalidateWork",
  "hasNativeDebt",
])
  assert(
    find(C, name).getText(C) === find(oldCore, name).getText(oldCore),
    `Old N/core scheduler debt changed ${name}`,
  );
for (const token of [
  "setTimeout",
  "clearTimeout",
  "requestAnimationFrame",
  "cancelAnimationFrame",
])
  assert(
    C.getText().split(token).length === oldCore.getText().split(token).length,
    `Changed scheduler port count ${token}`,
  );
const oldNative = parse(
  N.fileName,
  fs.readFileSync(
    `${root}/preimages/${N.fileName.replaceAll("/", "__")}.preimage`,
    "utf8",
  ),
);
for (const name of [
  "releaseNativeAttachment",
  "attachmentCleanup",
  "sealNativeRefs",
  "nativeRefStatus",
])
  assert(
    find(N, name).getText(N) === find(oldNative, name).getText(oldNative),
    `Existing exact-ref/seal lifetime changed: ${name}`,
  );
const NativeClass = leased.filter((file) =>
    file.endsWith("controlled-collection.tsx"),
  )[0],
  controls = fs.readFileSync(NativeClass, "utf8");
assert(
  controls.includes("RowMoveControls") && controls.includes("{cell.content}"),
  "Row controls must preserve native content",
);
assert(
  !/onSubmit\s*\(/.test(B.getText()) && !/\.begin\s*\(/.test(B.getText()),
  "No normal notification wrapper/raw terminal in binding",
);
assert(
  !leased.some((file) => /packages\/react\//.test(file)),
  "No headless production lease",
);
console.log(
  `Parsed${parsedSources.length} TS/TSX inputs within the${sources.length}-source inventory; checked closed N/R cuts, callback-free transfer, source-only/Number gates and unchanged timer debt. Structural proof only; all runtime remains UNRUN.`,
);
