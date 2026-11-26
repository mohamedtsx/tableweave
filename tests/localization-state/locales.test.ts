import { describe, expect, test } from "vitest";
import { arabicTableweaveLocale } from "../../packages/heroui/src/localization/arabic.js";
import {
  arabicDataTableLocale,
  englishDataTableLocale,
} from "../../packages/heroui/src/localization/data-table.js";
import { englishTableweaveLocale } from "../../packages/heroui/src/localization/english.js";

const keys = [
  "uncommitted",
  "unavailable",
  "idle",
  "loading",
  "initialError",
  "offline",
  "timeout",
  "updating",
  "updateFailed",
  "emptyDataset",
  "noMatches",
  "unknownEmpty",
  "noRecordOnPage",
  "retry",
].sort();

describe.each([
  [englishDataTableLocale, englishTableweaveLocale],
  [arabicDataTableLocale, arabicTableweaveLocale],
] as const)("table-state locale %j", (locale, original) => {
  test("adds exactly the finite state dictionary without changing old ports", () => {
    expect(Object.keys(locale.messages.state).sort()).toEqual(keys);
    expect(Object.keys(original.messages)).toHaveLength(11);
    expect(Object.hasOwn(original.messages, "state")).toBe(false);
    for (const key of Object.keys(original.messages) as Array<
      keyof typeof original.messages
    >)
      expect(locale.messages[key]).toBe(original.messages[key]);
    expect(locale.builtinOperatorLabels).toBe(original.builtinOperatorLabels);
    expect(locale.locale).toBe(original.locale);
    expect(locale.direction).toBe(original.direction);
  });

  test("new containers are frozen and all state values are nonempty strings", () => {
    expect(Object.isFrozen(locale)).toBe(true);
    expect(Object.isFrozen(locale.messages)).toBe(true);
    expect(Object.isFrozen(locale.messages.state)).toBe(true);
    for (const value of Object.values(locale.messages.state)) {
      expect(typeof value).toBe("string");
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});

test("unknown cause is not a no-matches claim and retry has no transport", () => {
  for (const locale of [englishDataTableLocale, arabicDataTableLocale]) {
    expect(locale.messages.state.unknownEmpty).not.toBe(
      locale.messages.state.noMatches,
    );
    expect(locale.messages.state.noRecordOnPage).not.toBe(
      locale.messages.state.emptyDataset,
    );
    expect(typeof locale.messages.state.retry).toBe("string");
    expect(Object.hasOwn(locale, "onRetry")).toBe(false);
  }
});
