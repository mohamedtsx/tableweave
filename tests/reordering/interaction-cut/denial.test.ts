import { expect, it } from "vitest";
import { revokeReorderInteraction } from "../../../packages/react/src/reordering-controller/index.js";
import { fixture } from "../admission/fixtures.js";
it("unknown release authenticates by identity before all alleged payloads", () => {
  const f = fixture(),
    lease = f.admission.mount();
  let traps = 0;
  const alleged = new Proxy(
    {},
    {
      get() {
        traps++;
        throw 0;
      },
      ownKeys() {
        traps++;
        throw 0;
      },
      getPrototypeOf() {
        traps++;
        throw 0;
      },
    },
  );
  const ended = Proxy.revocable({}, {});
  ended.revoke();
  try {
    for (const input of [
      undefined,
      null,
      true,
      2,
      Symbol("cut"),
      "cut",
      () => {},
      alleged,
      ended.proxy,
      f.admission,
      lease,
      f.D,
      f.C,
      f.P,
    ])
      expect(revokeReorderInteraction(input)).toBeUndefined();
    expect(
      Reflect.apply(revokeReorderInteraction, alleged, [alleged]),
    ).toBeUndefined();
    expect(traps).toBe(0);
    expect(f.counts.metadata).toBe(0);
    expect(f.counts.eligibility).toBe(0);
  } finally {
    f.dispose();
  }
});
