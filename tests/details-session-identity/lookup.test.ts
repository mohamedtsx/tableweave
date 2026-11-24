import { describe, expect, it } from "vitest";
import { getDetailsSessionOwner } from "../../packages/heroui/src/details/session-identity.js";

const lookup = (value: unknown) =>
  Reflect.apply(getDetailsSessionOwner, undefined, [value]);

describe("private identity lookup denial (no permitting fixtures)", () => {
  it("rejects unknown primitives, functions and structural objects", () => {
    for (const value of [
      undefined,
      null,
      false,
      1,
      1n,
      "",
      Symbol(),
      () => {},
      {},
    ])
      expect(lookup(value)).toBeNull();
  });

  it("does not inspect getters, prototype, keys or methods on unknown input", () => {
    let reads = 0;
    const target = Object.defineProperty({}, "context", {
      get() {
        reads++;
        throw new Error("Must not read alleged context");
      },
    });
    const proxy = new Proxy(target, {
      get() {
        reads++;
        throw new Error("Must not get");
      },
      getPrototypeOf() {
        reads++;
        throw new Error("Must not inspect prototype");
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw new Error("Must not reflect descriptors");
      },
      ownKeys() {
        reads++;
        throw new Error("Must not enumerate");
      },
    });
    expect(lookup(target)).toBeNull();
    expect(lookup(proxy)).toBeNull();
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(lookup(revoked.proxy)).toBeNull();
    expect(reads).toBe(0);
  });
});
