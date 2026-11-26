import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { dateEditorMessages } from "../../packages/heroui/src/date/date-types.js";
import { builderMessages, operatorLabel } from "../../packages/heroui/src/filters/messages.js";
import { paginationMessages } from "../../packages/heroui/src/pagination/messages.js";
import { defaultCollectionMessages } from "../../packages/heroui/src/table/collection-messages.js";
import {
  arabicTableweaveLocale as ar,
  englishTableweaveLocale as en,
} from "../../packages/heroui/src/localization/index.js";
import type { TableweaveMessages } from "../../packages/heroui/src/localization/index.js";
import { readDefault } from "./defaults.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const source = "packages/heroui/src/";
function originals() {
  const tool = readDefault(root, `${source}toolbar/filter-shared.ts`, "filterToolMessages");
  const bindings = { filterToolMessages: tool, dateEditorMessages };
  return {
    builder: builderMessages,
    search: readDefault(root, `${source}toolbar/filter-search.tsx`, "defaults", bindings),
    tabs: readDefault(root, `${source}toolbar/filter-tabs.tsx`, "defaults", bindings),
    date: readDefault(root, `${source}toolbar/filter-date.tsx`, "defaults", bindings),
    dateEditor: dateEditorMessages,
    collection: defaultCollectionMessages,
    sorting: readDefault(root, `${source}sorting/sorting.tsx`, "defaultSortingMessages"),
    columnChooser: readDefault(root, `${source}columns/column-chooser.tsx`, "defaultColumnChooserMessages"),
    selectionToolbar: readDefault(root, `${source}selection/selection-toolbar.tsx`, "defaults"),
    pagination: paginationMessages,
    details: readDefault(root, `${source}details/details-shell.tsx`, "englishDetailsMessages"),
  } satisfies Record<keyof TableweaveMessages, object>;
}

test("all11 actual message ports have exactly their existing complete keys and English static defaults", () => {
  const defaults = originals();
  const names = Object.keys(defaults) as (keyof TableweaveMessages)[];
  assert.equal(names.length, 11);
  assert.deepEqual(Object.keys(en.messages).sort(), names.toSorted());
  assert.deepEqual(Object.keys(ar.messages).sort(), names.toSorted());
  for (const name of names) {
    const original = defaults[name];
    assert.deepEqual(Object.keys(en.messages[name]).sort(), Object.keys(original).sort(), name);
    assert.deepEqual(Object.keys(ar.messages[name]).sort(), Object.keys(original).sort(), name);
    for (const key of Object.keys(original)) {
      const reference: unknown = Reflect.get(original, key);
      const english: unknown = Reflect.get(en.messages[name], key);
      const arabic: unknown = Reflect.get(ar.messages[name], key);
      assert.equal(typeof english, typeof reference, `${name}.${key}`);
      assert.equal(typeof arabic, typeof reference, `${name}.${key}`);
      if (typeof reference === "string") {
        assert.equal(english, reference, `${name}.${key} English parity`);
        assert.equal(typeof arabic, "string");
        assert((arabic as string).trim().length > 0);
        if (/[A-Za-z]/.test(reference)) assert(/[\u0600-\u06ff]/.test(arabic as string), `${name}.${key} Arabic text`);
      }
    }
  }
});

test("English template functions match real defaults across their representative branches", () => {
  const defaults = originals();
  function same(name: keyof TableweaveMessages, key: string, args: readonly unknown[]) {
    const actual: unknown = Reflect.get(en.messages[name], key);
    const expected: unknown = Reflect.get(defaults[name], key);
    assert.equal(typeof actual, "function");
    assert.equal(typeof expected, "function");
    assert.equal(Reflect.apply(actual as (...values: unknown[]) => unknown, undefined, args), Reflect.apply(expected as (...values: unknown[]) => unknown, undefined, args), `${name}.${key}`);
  }
  for (const direction of [null, "ascending", "descending"] as const)
    same("collection", "sortButton", ["Synthetic field", direction, direction ? 2 : null]);
  for (const direction of ["ascending", "descending"] as const)
    same("collection", "sortEntry", ["stable-field", direction, 2]);
  same("collection", "rowCheckbox", ["Synthetic row"]);
  same("collection", "sortPriority", [2]);
  same("collection", "selectedCount", [0]);
  same("collection", "subscribedCount", [17]);
  same("sorting", "actionName", ["Remove", "Synthetic field"]);
  for (const visibility of ["", "Hidden column"])
    same("sorting", "priority", ["2", "Synthetic field", "Ascending", visibility]);
  same("selectionToolbar", "selectedCount", [17]);
  same("date", "formatTimeZone", ["UTC"]);
  const context = { locale: "en-US", timeZone: "UTC", evaluatedAt: 0 };
  for (const value of [
    { kind: "day", value: "2026-11-24" },
    { kind: "instant", value: "2026-11-24T12:00:00.123Z" },
    { kind: "relative", preset: "today" },
    { kind: "rolling", direction: "past", days: 7 },
  ]) same("date", "formatSummary", [{ operator: "date.on", value }, context]);
  same("date", "formatSummary", [{ operator: "date.between", value: [{ kind: "day", value: "2026-11-24" }, { kind: "day", value: "2026-11-25" }] }, context]);
  for (const preset of ["today", "yesterday", "tomorrow", "thisWeek", "lastWeek", "nextWeek", "thisMonth", "lastMonth", "nextMonth", "thisYear", "lastYear", "nextYear"])
    same("dateEditor", "formatRelative", [{ kind: "relative", preset }]);
  for (const direction of ["past", "future"])
    same("dateEditor", "formatRelative", [{ kind: "rolling", direction, days: 7 }]);
  const cases: readonly [string, readonly string[]][] = [
    ["page", ["2"]], ["knownPage", ["2", "10"]], ["outOfRange", ["11", "10"]],
    ["knownRange", ["11", "20", "173"]], ["unknownTotalRange", ["11", "20"]],
    ["unknownRangeKnownTotal", ["173"]],
  ];
  for (const [key, args] of cases) same("pagination", key, args);
});

test("all36 built-in IDs are unchanged, English matches private defaults, Arabic supplies human labels", () => {
  const original = readDefault(root, `${source}filters/messages.ts`, "labels");
  assert.equal(Object.keys(original).length, 36);
  assert.deepEqual(Object.keys(en.builtinOperatorLabels).sort(), Object.keys(original).sort());
  assert.deepEqual(Object.keys(ar.builtinOperatorLabels).sort(), Object.keys(original).sort());
  for (const id of Object.keys(original)) {
    assert.equal(en.builtinOperatorLabels[id], operatorLabel(id));
    assert(/[\u0600-\u06ff]/.test(ar.builtinOperatorLabels[id] ?? ""));
    assert.notEqual(ar.builtinOperatorLabels[id], id);
  }
  assert.equal(operatorLabel("app.custom"), "app.custom");
  const app = { "text.contains": "Synthetic app wording", "app.custom": "Synthetic custom label" };
  assert.equal(operatorLabel("text.contains", { ...ar.builtinOperatorLabels, ...app }), app["text.contains"]);
  assert.equal(operatorLabel("app.custom", { ...ar.builtinOperatorLabels, ...app }), app["app.custom"]);
  assert.equal(Object.hasOwn(ar.builtinOperatorLabels, "app.custom"), false);
  assert.equal(Object.hasOwn(ar.messages.builder, "operatorLabels"), false);
});

test("new dictionary containers are immutable without freezing or mutating existing defaults", () => {
  assert.equal(en.locale, "en-US"); assert.equal(en.direction, "ltr");
  assert.equal(ar.locale, "ar"); assert.equal(ar.direction, "rtl");
  for (const locale of [en, ar]) {
    assert(Object.isFrozen(locale));
    assert(Object.isFrozen(locale.messages));
    assert(Object.isFrozen(locale.builtinOperatorLabels));
    for (const dictionary of Object.values(locale.messages)) assert(Object.isFrozen(dictionary));
    assert.equal(Reflect.set(locale.messages.builder, "filters", "changed"), false);
    assert.equal(Reflect.set(locale.builtinOperatorLabels, "empty", "changed"), false);
  }
  assert.notEqual(en.messages.builder, builderMessages);
  assert.notEqual(en.messages.dateEditor, dateEditorMessages);
  assert.notEqual(en.messages.collection, defaultCollectionMessages);
  assert.notEqual(en.messages.pagination, paginationMessages);
  assert.equal(Object.isFrozen(builderMessages), false);
  assert.equal(Object.isFrozen(dateEditorMessages), false);
  assert.equal(builderMessages.filters, "Filters");
});

test("Arabic templates preserve preformatted digits, application labels and stable IDs without numeric parsing", () => {
  assert.equal(ar.messages.pagination.knownPage("٢", "١٠"), "الصفحة ٢ من ١٠");
  assert.equal(ar.messages.pagination.knownRange("١١", "٢٠", "١٧٣"), "١١–٢٠ من إجمالي السجلات: ١٧٣");
  assert.equal(ar.messages.pagination.unknownTotalRange("١١", "٢٠"), "نطاق السجلات: ١١–٢٠");
  assert.equal(ar.messages.pagination.unknownRangeKnownTotal("١٧٣"), "نطاق السجلات غير متاح للصفحة المعروضة. إجمالي السجلات: ١٧٣.");
  assert.equal(ar.messages.sorting.priority("٢", "Synthetic field", "تصاعدي", "عمود مخفي"), "٢. Synthetic field: تصاعدي (عمود مخفي)");
  assert.equal(ar.messages.collection.rowCheckbox("synthetic-row"), "تحديد synthetic-row");
  assert.equal(ar.messages.collection.sortEntry("stable-field", "ascending", 2), "stable-field تصاعدي، الأولوية 2");
  assert.equal(ar.messages.collection.sortButton("stable-field", null, null), "ترتيب stable-field، غير مرتب");
  assert.equal(ar.messages.collection.sortButton("stable-field", "descending", 1), "ترتيب stable-field، تنازلي، الأولوية 1");
  assert.equal(ar.messages.selectionToolbar.selectedCount(0), "عدد الصفوف المحددة: 0");
  assert.equal(ar.messages.dateEditor.formatRelative({ kind: "relative", preset: "today" }), "اليوم");
  assert.equal(ar.messages.dateEditor.formatRelative({ kind: "rolling", days: 7, direction: "past" }), "الفترة السابقة — عدد الأيام التقويمية: 7");
  assert.equal(ar.messages.date.formatTimeZone("UTC"), "المنطقة الزمنية: UTC");
  const context = { locale: "ar", timeZone: "UTC", evaluatedAt: 0 };
  assert.equal(ar.messages.date.formatSummary({ operator: "date.on", value: { kind: "relative", preset: "tomorrow" } }, context), "غدًا");
  const day = new Intl.DateTimeFormat("ar", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }).format(new Date("2026-11-24T00:00:00.000Z"));
  assert.equal(ar.messages.date.formatSummary({ operator: "date.on", value: { kind: "day", value: "2026-11-24" } }, context), day);
});
