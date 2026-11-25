import { expect, it } from "vitest";
import {
  captureReorderNavigation,
  claimReorderUI,
  observeReorderUI,
  releaseReorderUI,
  requireReorderModel,
} from "../../../packages/react/src/reordering-controller/index.js";
import { fixture } from "../admission/fixtures.js";

it("genuine construction/app lease reads no metadata, exclusive UI claim is explicit", () => {
  const f = fixture();
  const lease = f.admission.mount();
  try {
    expect(f.counts.metadata).toBe(0);
    const ui = {};
    const binding = claimReorderUI(f.D, f.admission, lease, ui);
    expect(claimReorderUI(f.D, f.admission, lease, ui)).toBe(binding);
    expect(observeReorderUI(binding)).toMatchObject({
      joined: false,
      pending: false,
    });
    expect(() => claimReorderUI(f.D, f.admission, lease, {})).toThrow();
    expect(f.counts.metadata).toBe(0);
    releaseReorderUI(binding);
    const replacement = claimReorderUI(f.D, f.admission, lease, {});
    releaseReorderUI(binding);
    expect(observeReorderUI(replacement).joined).toBe(false);
    expect(f.admission.getSnapshot().phase).toBe("unready");
  } finally {
    f.dispose();
  }
});
it("counterfeit definition/handle/current lease proofs deny before malicious properties", () => {
  const f = fixture();
  const lease = f.admission.mount();
  let reads = 0;
  const alleged = new Proxy(
    {},
    {
      get() {
        reads++;
        throw 0;
      },
      ownKeys() {
        reads++;
        throw 0;
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw 0;
      },
    },
  );
  try {
    for (const args of [
      [new Proxy(f.D, {}), alleged, alleged, alleged],
      [f.D, alleged, alleged, alleged],
      [f.D, f.admission, alleged, alleged],
    ])
      expect(() => Reflect.apply(claimReorderUI, undefined, args)).toThrow();
    expect(() =>
      Reflect.apply(captureReorderNavigation, undefined, [alleged]),
    ).toThrow();
    expect(() =>
      Reflect.apply(requireReorderModel, undefined, [alleged, alleged]),
    ).toThrow();
    expect(reads).toBe(0);
    expect(f.counts.metadata).toBe(0);
    f.admission.disconnect(lease);
    expect(() => claimReorderUI(f.D, f.admission, lease, {})).toThrow();
  } finally {
    f.dispose();
  }
});
