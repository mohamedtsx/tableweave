import { projectControls } from "@tableweave/react";
import { describe, expect, it } from "vitest";
import {
  captureCorrectionOrigin,
  captureKnownCorrection,
  readCorrectionEpoch,
} from "../../../packages/heroui/src/pagination/correction-capture.js";
import { context, fixture, records } from "../core/fixtures.js";

describe("correction descriptor/callback envelope capture", () => {
  it("never invokes a returned Promise's constructor/species hooks or mutates it", () => {
    const f = fixture();
    let reads = 0;
    const poisonedConstructor = Object.defineProperty({}, Symbol.species, {
      get() {
        reads++;
        throw new Error("Synthetic species hook");
      },
    });
    for (const descriptor of [
      {
        get() {
          reads++;
          throw new Error("Synthetic constructor hook");
        },
      },
      { value: poisonedConstructor },
    ]) {
      const result = Promise.resolve(null);
      Object.defineProperty(result, "constructor", descriptor);
      const before = Object.getOwnPropertyDescriptor(result, "constructor");
      const captured = captureCorrectionOrigin({
        definition: f.definition,
        context,
        epoch: 0,
        readCurrent: () => result,
      });
      if (!captured) throw new Error("Missing synthetic envelope");
      expect(readCorrectionEpoch(captured)).toBeNull();
      expect(Object.getOwnPropertyDescriptor(result, "constructor")).toEqual(
        before,
      );
      expect(Object.isFrozen(result)).toBe(false);
    }
    expect(reads).toBe(0);
  });
  it("a plain object with Promise's prototype is not treated as a branded Promise", () => {
    const f = fixture();
    const result: unknown = Object.create(Promise.prototype);
    const captured = captureCorrectionOrigin({
      definition: f.definition,
      context,
      epoch: 0,
      readCurrent: () => result,
    });
    if (!captured) throw new Error("Missing synthetic envelope");
    expect(readCorrectionEpoch(captured)).toBeNull();
  });
  it("rejects accessor origins without invoking them or the lifecycle port", () => {
    const f = fixture();
    let reads = 0;
    const input = {
      definition: f.definition,
      epoch: 0,
      get context() {
        reads++;
        return context;
      },
      readCurrent() {
        reads++;
        return { context, epoch: 0 };
      },
    };
    expect(captureCorrectionOrigin(input)).toBeNull();
    expect(reads).toBe(0);
  });
  it("captures the original callback once and preserves its original method receiver", () => {
    const f = fixture();
    const input = {
      definition: f.definition,
      context,
      epoch: 0,
      readCurrent() {
        expect(this).toBe(input);
        return { context: this.context, epoch: this.epoch };
      },
    };
    const captured = captureCorrectionOrigin(input);
    expect(captured).not.toBeNull();
    input.readCurrent = () => {
      throw new Error("Rebound callback must not run");
    };
    if (!captured) throw new Error("Missing synthetic envelope");
    expect(readCorrectionEpoch(captured)?.access).toBe(true);
  });
  it("contains throwing, malformed, async and proxy descriptor failures", async () => {
    const f = fixture();
    for (const readCurrent of [
      () => {
        throw new Error("Synthetic private detail");
      },
      () => null,
      async () => {
        throw new Error("Synthetic private async detail");
      },
      () =>
        new Proxy(
          {},
          {
            getOwnPropertyDescriptor() {
              throw new Error("Synthetic descriptor failure");
            },
          },
        ),
    ]) {
      const captured = captureCorrectionOrigin({
        definition: f.definition,
        context,
        epoch: 0,
        readCurrent,
      });
      if (!captured) throw new Error("Missing synthetic envelope");
      expect(readCorrectionEpoch(captured)).toBeNull();
    }
    await Promise.resolve();
  });
  it("rejects current nested accessors and then getters without invocation", () => {
    const f = fixture();
    let reads = 0;
    const getter = {
      get() {
        reads++;
        return true;
      },
    };
    for (const result of [
      {
        context: Object.defineProperty({ ...context }, "access", getter),
        epoch: 0,
      },
      // biome-ignore lint/suspicious/noThenProperty: Intentional hostile thenable regression; its getter must never run.
      Object.defineProperty({ context, epoch: 0 }, "then", getter),
      Object.defineProperty({ context, epoch: 0 }, "epoch", getter),
    ]) {
      const captured = captureCorrectionOrigin({
        definition: f.definition,
        context,
        epoch: 0,
        readCurrent: () => result,
      });
      if (!captured) throw new Error("Missing synthetic envelope");
      expect(readCorrectionEpoch(captured)).toBeNull();
    }
    expect(reads).toBe(0);
  });
  it("copies metadata only, never reads/clones/freezes records or query trees", () => {
    const f = fixture();
    f.begin();
    f.succeed();
    const facts = projectControls(f.definition, f.server());
    const displayed = facts.displayed;
    if (!displayed) throw new Error("Missing synthetic displayed page");
    let reads = 0;
    const before = records.map((record) => Object.isFrozen(record));
    const input = {
      ...facts,
      displayed: Object.defineProperty({ ...displayed }, "query", {
        get() {
          reads++;
          throw new Error("Do not read query trees");
        },
      }),
    };
    Object.defineProperty(input, "rows", {
      get() {
        reads++;
        throw new Error("Do not read application rows");
      },
    });
    expect(captureKnownCorrection(input)).not.toBeNull();
    expect(reads).toBe(0);
    expect(records.map((record) => Object.isFrozen(record))).toEqual(before);
  });
  it("rejects nested pagination/page/range/request metadata accessors without invocation", () => {
    const f = fixture();
    f.begin();
    f.succeed();
    const facts = projectControls(f.definition, f.server());
    const displayed = facts.displayed;
    if (!displayed) throw new Error("Missing synthetic displayed page");
    let reads = 0;
    const getter = {
      get() {
        reads++;
        return 1;
      },
    };
    for (const [key, nested] of [
      [
        "pagination",
        Object.defineProperty({ ...displayed.pagination }, "pageSize", getter),
      ],
      [
        "pageInfo",
        Object.defineProperty({ ...displayed.pageInfo }, "total", getter),
      ],
      ["range", Object.defineProperty({ from: 1, to: 2 }, "from", getter)],
      [
        "request",
        Object.defineProperty({ ...displayed.request }, "generation", getter),
      ],
    ] as const) {
      expect(
        captureKnownCorrection({
          ...facts,
          displayed: { ...displayed, [key]: nested },
        }),
      ).toBeNull();
    }
    expect(reads).toBe(0);
  });
});
