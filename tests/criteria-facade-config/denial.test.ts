import { expect, it } from "vitest";
import {
  consumeCriteriaFacadeHostSkip,
  createCriteriaFacadeSource,
  criteriaFacadeIdentity,
} from "../../packages/heroui/src/filters/criteria-facade-config.js";

it("unknown source/cell/receipt rejects without reading alleged cell methods", () => {
  let reads = 0;
  const alleged = new Proxy(
    {},
    {
      get() {
        reads++;
        throw 0;
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw 0;
      },
      getPrototypeOf() {
        reads++;
        throw 0;
      },
    },
  );
  expect(() =>
    Reflect.apply(createCriteriaFacadeSource, undefined, [alleged, "search"]),
  ).toThrow();
  expect(criteriaFacadeIdentity(alleged)).toBeNull();
  expect(
    consumeCriteriaFacadeHostSkip(
      new Error("Criteria facade layout skipped."),
      alleged,
      alleged,
      alleged,
    ),
  ).toBe(false);
  expect(reads).toBe(0);
});
