import { expect, it } from "vitest";
import {
  claimReorderUI,
  observeReorderUI,
  releaseReorderUI,
} from "../../../packages/react/src/reordering-controller/index.js";
import { fixture } from "../admission/fixtures.js";

it("unknown/copy/proxy claims cannot install a source predicate or read payloads", () => {
  const f = fixture(),
    lease = f.admission.mount();
  let payloads = 0;
  const alleged = new Proxy(
    {},
    {
      get() {
        payloads++;
        throw new Error("Alleged source predicate is not authority");
      },
      ownKeys() {
        payloads++;
        throw new Error("Alleged private payload");
      },
    },
  );
  try {
    expect(() =>
      Reflect.apply(claimReorderUI, undefined, [
        f.D,
        alleged,
        alleged,
        alleged,
      ]),
    ).toThrow();
    expect(() =>
      Reflect.apply(claimReorderUI, undefined, [
        f.D,
        f.admission,
        alleged,
        alleged,
      ]),
    ).toThrow();
    expect(() =>
      Reflect.apply(observeReorderUI, undefined, [alleged]),
    ).toThrow();
    const binding = claimReorderUI(f.D, f.admission, lease, {});
    expect(() => observeReorderUI(new Proxy(binding, {}))).toThrow();
    expect(() => observeReorderUI({ ...binding })).toThrow();
    releaseReorderUI(binding);
    const b = claimReorderUI(f.D, f.admission, lease, {});
    const before = observeReorderUI(b);
    releaseReorderUI(binding);
    expect(observeReorderUI(b)).toBe(before);
    expect(payloads).toBe(0);
    expect(f.counts.metadata).toBe(0);
  } finally {
    f.dispose();
  }
});
