import { describe, expect, test } from "vitest";
import {
  captureAuthority,
  captureCallback,
  captureContext,
  captureCurrent,
  currentSource,
  sameAuthority,
  sameLifecycle,
  validAuthority,
} from "../../packages/heroui/src/details/identity.js";
import type { DetailsAuthority } from "../../packages/heroui/src/details/types.js";

const authority: DetailsAuthority = {
  context: {
    definitionKey: "definition",
    datasetKey: "dataset",
    scopeKey: "scope",
    access: true,
    epoch: 1,
  },
  rowId: "a",
  session: 2,
  generation: 3,
};
describe("detail provenance is independent of table-page requests", () => {
  test("retains only current source identity, including same-ID reopen and retry", () => {
    const source = { authority, status: "ready" as const, record: { id: "a" } };
    expect(currentSource({ ...authority }, source)).toEqual(source);
    expect(currentSource({ ...authority }, source)?.status).toBe("ready");
    for (const changed of [
      { ...authority, rowId: "b" },
      { ...authority, session: 3 },
      { ...authority, generation: 4 },
      { ...authority, context: { ...authority.context, epoch: 2 } },
      { ...authority, context: { ...authority.context, access: false } },
      { ...authority, context: { ...authority.context, datasetKey: "other" } },
      {
        ...authority,
        context: { ...authority.context, definitionKey: "other" },
      },
      { ...authority, context: { ...authority.context, scopeKey: "other" } },
    ]) {
      expect(sameAuthority(authority, changed)).toBe(false);
      expect(currentSource(changed, source)).toBeNull();
    }
  });
  test("rejects unsafe epoch/session/generation and empty IDs", () => {
    expect(validAuthority(authority)).toBe(true);
    expect(validAuthority({ ...authority, rowId: null })).toBe(true);
    for (const number of [
      -1,
      0.5,
      Number.POSITIVE_INFINITY,
      Number.NaN,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(validAuthority({ ...authority, session: number })).toBe(false);
      expect(validAuthority({ ...authority, generation: number })).toBe(false);
      expect(
        validAuthority({
          ...authority,
          context: { ...authority.context, epoch: number },
        }),
      ).toBe(false);
    }
    expect(validAuthority({ ...authority, rowId: "" })).toBe(false);
    expect(
      validAuthority({
        ...authority,
        context: { ...authority.context, datasetKey: "" },
      }),
    ).toBe(false);
  });
});

describe("lifecycle and callback boundaries", () => {
  test("generation changes freshness, not lifecycle; target/session/context remain exclusive", () => {
    const next = { ...authority, generation: authority.generation + 1 };
    expect(sameLifecycle(authority, next)).toBe(true);
    expect(sameAuthority(authority, next)).toBe(false);
    for (const changed of [
      { ...next, rowId: "b" },
      { ...next, session: authority.session + 1 },
      { ...next, context: { ...authority.context, access: false } },
      {
        ...next,
        context: { ...authority.context, epoch: authority.context.epoch + 2 },
      },
      { ...next, context: { ...authority.context, scopeKey: "b" } },
    ])
      expect(sameLifecycle(authority, changed)).toBe(false);
  });
  test("callback accessors/invalid values never become an absent default-allow policy", () => {
    let calls = 0;
    const accessor = Object.defineProperty({}, "policy", {
      get() {
        calls++;
        throw new Error("Private callback getter");
      },
    });
    const inherited = Object.create(accessor) as object;
    for (const input of [
      accessor,
      inherited,
      { policy: true },
      new Proxy(
        {},
        {
          getOwnPropertyDescriptor() {
            throw new Error("Private descriptor");
          },
        },
      ),
    ]) {
      const result = captureCallback<[], boolean>(input, "policy");
      expect(result.valid).toBe(false);
      expect(result.invoke).toBeNull();
    }
    expect(captureCallback<[], boolean>({}, "policy").valid).toBe(true);
    expect(captureCallback<[], boolean>({}, "policy", true).valid).toBe(false);
    expect(calls).toBe(0);
  });
  test("the validated callback reference is captured once with its original receiver", () => {
    let reads = 0;
    let denied = 0;
    let allowed = 0;
    const input = new Proxy(
      {
        policy() {
          return true;
        },
      },
      {
        getOwnPropertyDescriptor(_target, key) {
          if (key !== "policy") return undefined;
          return {
            configurable: true,
            enumerable: true,
            value:
              ++reads === 1
                ? function (this: unknown) {
                    expect(this).toBe(input);
                    denied++;
                    return false;
                  }
                : () => {
                    allowed++;
                    return true;
                  },
          };
        },
      },
    );
    const callback = captureCallback<[], boolean>(input, "policy");
    expect(callback.valid).toBe(true);
    expect(callback.invoke?.()).toBe(false);
    expect({ reads, denied, allowed }).toEqual({
      reads: 1,
      denied: 1,
      allowed: 0,
    });
  });
});

describe("primitive envelope capture", () => {
  test("accessors are rejected without invocation and snapshots do not reread changing descriptors", () => {
    let calls = 0;
    const input = Object.defineProperty({ ...authority.context }, "access", {
      get() {
        calls++;
        return true;
      },
    });
    expect(captureContext(input)).toBeNull();
    expect(captureAuthority({ ...authority, context: input })).toBeNull();
    expect(calls).toBe(0);
    let descriptors = 0;
    const changing = new Proxy(
      { ...authority.context },
      {
        getOwnPropertyDescriptor(target, key) {
          if (key === "access")
            return {
              configurable: true,
              enumerable: true,
              value: ++descriptors === 1,
            };
          return Object.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    const captured = captureContext(changing);
    expect(captured?.access).toBe(true);
    expect(captured?.access).toBe(true);
    expect(descriptors).toBe(1);
    expect(Object.isFrozen(captured)).toBe(true);
  });

  test("denied authority skips source and optional-frame inspection entirely", () => {
    let calls = 0;
    const denied = {
      ...authority,
      context: { ...authority.context, access: false },
    };
    const source = new Proxy(
      {},
      {
        getPrototypeOf() {
          calls++;
          throw new Error("Uninspected source");
        },
      },
    );
    const current = Object.defineProperty(
      { authority: denied },
      "nativeFrame",
      {
        get() {
          calls++;
          throw new Error("Uninspected frame");
        },
      },
    );
    expect(currentSource(denied, source)).toBeNull();
    expect(captureCurrent(current)).toBeNull();
    expect(calls).toBe(0);
  });

  test("metadata proxy failures are opaque and accessors never run", () => {
    for (const traps of [
      {
        getPrototypeOf() {
          throw new Error("Private prototype failure");
        },
      },
      {
        getOwnPropertyDescriptor() {
          throw new Error("Private descriptor failure");
        },
      },
    ]) {
      const hostile = new Proxy(authority, traps);
      expect(captureAuthority(hostile)).toBeNull();
      expect(captureCurrent({ authority: hostile })).toBeNull();
      expect(currentSource(authority, hostile)).toBeNull();
    }
    let calls = 0;
    const source = Object.defineProperty({ status: "ready" }, "authority", {
      get() {
        calls++;
        throw new Error("Private getter");
      },
    });
    expect(currentSource(authority, source)).toBeNull();
    expect(calls).toBe(0);
  });

  test("ready records are opaque references, never inspected, cloned or frozen", () => {
    let calls = 0;
    const record = new Proxy(
      { id: "a" },
      {
        get() {
          calls++;
          throw new Error("Record belongs to app");
        },
        ownKeys() {
          calls++;
          throw new Error("No cloning");
        },
        preventExtensions() {
          calls++;
          throw new Error("No freezing");
        },
      },
    );
    const result = currentSource<object>(authority, {
      authority,
      status: "ready",
      record,
    });
    expect(result?.status === "ready" && result.record === record).toBe(true);
    expect(Object.isExtensible(record)).toBe(true);
    expect(calls).toBe(0);
  });
});
