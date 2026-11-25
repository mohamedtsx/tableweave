import { expect, it } from "vitest";
import { createCriteriaBuilderStore } from "../../packages/heroui/src/filters/criteria-builder-host.js";
import { consumeCriteriaFacadeHostSkip } from "../../packages/heroui/src/filters/criteria-facade-config.js";

it("unknown/copied/proxied markers and forged receipts never traverse private props", () => {
  for (const marker of [{}, new Proxy({}, {}), Object.freeze({})]) {
    const store = createCriteriaBuilderStore(),
      stop = store.mount();
    let reads = 0;
    const input = new Proxy(
      { criteria: marker },
      {
        getOwnPropertyDescriptor(target, key) {
          if (key !== "criteria") reads++;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    store.commit(input);
    expect(store.read()).toBeNull();
    expect(reads).toBe(0);
    expect(
      consumeCriteriaFacadeHostSkip(
        new Error("Criteria facade layout skipped."),
        input,
        {},
        {},
      ),
    ).toBe(false);
    stop();
  }
});
