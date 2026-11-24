import { expect, it } from "vitest";
import {
  getDetailsAccessoryOwner,
  getDetailsBinding,
} from "../../../packages/heroui/src/data-table/details-binding.js";
import { getAdoptedDetailsSessionOwner } from "../../../packages/heroui/src/details/session-identity.js";

it("unknown primitive/copy/proxy metadata is never a permitting fixture", () => {
  let reads = 0;
  const value = new Proxy(
    {},
    {
      get() {
        reads++;
        throw 0;
      },
      getPrototypeOf() {
        reads++;
        throw 0;
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw 0;
      },
    },
  );
  for (const input of [null, undefined, 1, {}, value]) {
    expect(
      Reflect.apply(getDetailsAccessoryOwner, undefined, [input]),
    ).toBeNull();
    expect(
      Reflect.apply(getAdoptedDetailsSessionOwner, undefined, [input]),
    ).toBeNull();
    expect(() =>
      Reflect.apply(getDetailsBinding, undefined, [input]),
    ).toThrow();
  }
  expect(reads).toBe(0);
});
