import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { readCriteriaDateToolbar } from "../../packages/heroui/src/date/criteria-date-state.js";
import { InstantPointEditor } from "../../packages/heroui/src/date/date-instant.js";
import { DateOperandEditor } from "../../packages/heroui/src/date/date-operand-editor.js";
import {
  DayPointPicker,
  DayRangePicker,
} from "../../packages/heroui/src/date/date-picker.js";
import { DateSegmentsObserver } from "../../packages/heroui/src/date/date-segments.js";
import type { DateOperandEditorProps } from "../../packages/heroui/src/date/date-types.js";
import type { FilterDateProps } from "../../packages/heroui/src/toolbar/filter-date.js";
import {
  criteriaDate,
  FilterDate,
} from "../../packages/heroui/src/toolbar/filter-date.js";
import type { S } from "./fixtures.js";
import { fixture, required } from "./fixtures.js";

it("legacy omission retains raw Date SSR; genuine supplied target is neutral before layout", () => {
  const f = fixture();
  expect(
    renderToString(
      <FilterDate controller={f.app.C} expectedContext={f.context} />,
    ),
  ).toContain("tw-filter-date-actions");
  expect(renderToString(<FilterDate {...f.props()} />)).toContain(
    "Filtering is unavailable.",
  );
});
it("genuine/unavailable criteria server branches never read private getters or call summary/relative/preset/registry callbacks", () => {
  const f = fixture();
  let reads = 0;
  const bad = () => {
    reads++;
    throw new Error("Private prelayout input");
  };
  const raw = () =>
    Object.defineProperties(
      {},
      Object.fromEntries(
        [
          "controller",
          "messages",
          "registry",
          "presets",
          "expectedContext",
          "className",
          "disabled",
        ].map((key) => [key, { get: bad }]),
      ),
    );
  for (const input of [
    Object.assign(raw(), { criteria: f.target }),
    Object.assign(raw(), { criteria: undefined }),
    Object.assign(raw(), { criteria: null }),
    Object.defineProperty(raw(), "criteria", { get: bad }),
    Object.setPrototypeOf(raw(), { criteria: f.target }),
  ]) {
    function Forward() {
      return FilterDate(input as FilterDateProps<S>);
    }
    expect(renderToString(<Forward />)).toContain("Filtering is unavailable.");
  }
  expect(reads).toBe(0);
});
it("every nested wrapper denies invalid or even genuine prelayout handle before touching supplied private editor props", () => {
  const f = fixture(),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const handle = required(
    readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
  );
  let reads = 0;
  const bad = () => {
    reads++;
    throw new Error("Nested private prelayout prop");
  };
  const raw = () =>
    Object.defineProperties(
      {},
      Object.fromEntries(
        [
          "field",
          "context",
          "messages",
          "label",
          "value",
          "initialValue",
          "onDraft",
          "onDraftChange",
          "resetKey",
        ].map((key) => [key, { get: bad }]),
      ),
    );
  for (const input of [
    Object.assign(raw(), { criteriaState: handle }),
    Object.assign(raw(), { criteriaState: undefined }),
    Object.assign(raw(), { criteriaState: {} }),
    Object.assign(raw(), { criteriaState: new Proxy(handle, {}) }),
    Object.defineProperty(raw(), "criteriaState", { get: bad }),
    Object.setPrototypeOf(raw(), { criteriaState: handle }),
  ]) {
    function Operand() {
      return DateOperandEditor(input as DateOperandEditorProps);
    }
    function Instant() {
      return InstantPointEditor(
        input as Parameters<typeof InstantPointEditor>[0],
      );
    }
    function Point() {
      return DayPointPicker(input as Parameters<typeof DayPointPicker>[0]);
    }
    function Range() {
      return DayRangePicker(input as Parameters<typeof DayRangePicker>[0]);
    }
    function Segments() {
      return DateSegmentsObserver(
        input as Parameters<typeof DateSegmentsObserver>[0],
      );
    }
    for (const Component of [Operand, Instant, Point, Range, Segments])
      expect(renderToString(<Component />)).toBe("");
  }
  expect(reads).toBe(0);
  stop();
});
