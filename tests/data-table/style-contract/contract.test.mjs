// AUTHORED ONLY. Do not run before the user-selected final verification phase.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { inspectCss } from "./inspect-css.mjs";
import { cssPath, root } from "./scope.mjs";

const original = await readFile(join(root, cssPath), "utf8");
test("actual authored module reserves only seven shell classes, focus and scoped hidden selectors", () => {
  const result = inspectCss(original);
  assert.equal(result.classes.length, 7);
  assert.equal(result.selectorCount, 10);
  assert.equal(
    result.selectors[".tw-data-table__collection"]["min-inline-size"],
    "0",
  );
});
test("no import/font/asset/color literal or important can join the reserved stylesheet", () => {
  for (const extra of [
    '@import "extra.css";',
    '@font-face { font-family: "Other"; }',
    ".tw-data-table { color: #000; }",
    ".tw-data-table { display: grid !important; }",
  ])
    assert.throws(() => inspectCss(original.replace(/}\s*$/, `${extra}\n}`)));
});
test("no physical width, new scroller, vendor rows, cards or column visibility override", () => {
  for (const extra of [
    ".tw-data-table { overflow-x: auto; }",
    ".tw-data-table { width: 100%; }",
    ".tw-data-table .table__row { height: 52px; }",
    ".tw-data-table [data-column-id] { visibility: hidden; }",
    ".tw-data-table__card { display: block; }",
  ])
    assert.throws(() => inspectCss(original.replace(/}\s*$/, `${extra}\n}`)));
});
test("both hidden selectors must retain display none; layout does not remove it", () => {
  assert.throws(() =>
    inspectCss(original.replace(".tw-data-table[hidden],", "")),
  );
  assert.throws(() =>
    inspectCss(original.replace(".tw-data-table [hidden]", "[hidden]")),
  );
  assert.throws(() =>
    inspectCss(original.replace("display: none;", "display: grid;")),
  );
});
test("shell flex wrapping does not reach inside root tool/rule segments or change text direction", () => {
  for (const extra of [
    ".tw-data-table__toolbar > * { flex-wrap: wrap; }",
    ".tw-data-table__toolbar .tw-filter-rule { display: contents; }",
    ".tw-data-table { direction: rtl; }",
  ])
    assert.throws(() => inspectCss(original.replace(/}\s*$/, `${extra}\n}`)));
});
