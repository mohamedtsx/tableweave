import { parseDateTime } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import type {
  DateFieldDefinition,
  FilterDateContext,
} from "../../../packages/heroui/src/date/date-types.js";
import {
  calendarSeed,
  instantWallTime,
  parseInstantInput,
  pickerBounds,
  wallTimeWire,
} from "../../../packages/heroui/src/date/date-wire.js";

const field: DateFieldDefinition = { type: "datetime", owner: "builder" };
const context: FilterDateContext = {
  locale: "en-US",
  timeZone: "America/New_York",
  evaluatedAt: Date.parse("2025-03-09T02:00:00.000Z"),
};
describe("date editor wire boundary", () => {
  it("seeds from the accepted clock and explicit zone", () => {
    expect(calendarSeed(context).toString()).toBe("2025-03-08");
  });
  it("does not inherit the vendor 1900–2099 calendar bounds", () => {
    const bounds = pickerBounds(field, context);
    expect(bounds.min.toString()).toBe("0001-01-01");
    expect(bounds.max.toString()).toBe("9999-12-31");
  });
  it("retains exact fractional instant precision and explicit offset", () => {
    const value = parseInstantInput(
      "2025-11-02T01:30:00.123-04:00",
      field,
      context,
    );
    expect(value).toEqual({
      kind: "instant",
      value: "2025-11-02T01:30:00.123-04:00",
    });
    if (!value) throw new Error("Expected valid synthetic instant");
    expect(instantWallTime(value, context).millisecond).toBe(123);
  });
  it("rejects a local datetime without an explicit offset and invalid literals", () => {
    expect(
      parseInstantInput("2025-11-02T01:30:00.123", field, context),
    ).toBeNull();
    expect(
      parseInstantInput("2025-02-30T10:00:00Z", field, context),
    ).toBeNull();
  });
  it("never silently resolves DST gaps or folds", () => {
    expect(() =>
      wallTimeWire(parseDateTime("2025-03-09T02:30:00"), context),
    ).toThrow();
    expect(() =>
      wallTimeWire(parseDateTime("2025-11-02T01:30:00"), context),
    ).toThrow();
    expect(
      wallTimeWire(parseDateTime("2025-03-09T03:30:00.123"), context),
    ).toEqual({ kind: "instant", value: "2025-03-09T07:30:00.123Z" });
  });
});
