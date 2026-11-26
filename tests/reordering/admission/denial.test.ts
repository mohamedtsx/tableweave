import { expect, it } from "vitest";
import {
  createReorderController,
  getReorderAdmissionOwner,
  requireReorderAdmission,
} from "../../../packages/react/src/reordering-controller/index.js";
import { assertTableController } from "../../../packages/react/src/table/definition.js";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { fixture } from "./fixtures.js";

it("D is authenticated before alleged methods or options; copied/proxied D never creates C", () => {
  const f = fixture();
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
    },
  );
  try {
    for (const D of [{ ...f.D }, new Proxy(f.D, {})])
      expect(() =>
        Reflect.apply(createReorderController, undefined, [D, alleged]),
      ).toThrow();
    expect(reads).toBe(0);
    expect(f.counts.metadata).toBe(0);
    expect(f.counts.eligibility).toBe(0);
    expect(assertTableController(f.D, f.C)).toBe(f.CD);
    expect(Object.isFrozen(f.C)).toBe(true);
  } finally {
    f.dispose();
  }
});
it("raw actual same-D C is not retrofitted; copied/proxied handle cannot borrow methods", () => {
  const f = fixture();
  const raw = f.D.createController({
    initial: {
      query: createQuery(f.schema, { locale: "en-US", timeZone: "UTC" }),
    },
    now: () => 0,
  });
  try {
    expect(() => requireReorderAdmission(f.admission, f.D, raw)).toThrow();
    for (const handle of [{ ...f.admission }, new Proxy(f.admission, {})]) {
      expect(getReorderAdmissionOwner(handle)).toBeNull();
      expect(() => handle.mount()).toThrow();
    }
    expect(f.counts.metadata).toBe(0);
    const first = f.admission.getSnapshot();
    expect(f.admission.getSnapshot()).toBe(first);
  } finally {
    raw.dispose();
    f.dispose();
  }
});
it("selection Cancel and reject remain available without a model or metadata grant", () => {
  const f = fixture();
  try {
    f.callbacks.metadata = () => {
      throw new Error("No application read during cleanup");
    };
    expect(f.C.dispatch({ type: "selection.cancel" }).status).toBe("committed");
    expect(Object.keys(f.C.getSnapshot().selection)).toEqual([]);
    expect(f.counts.metadata).toBe(0);
  } finally {
    f.dispose();
  }
});
it("initial validator runs but constructor never reads metadata or claims a mount", () => {
  const f = fixture();
  try {
    expect(f.counts.metadata).toBe(0);
    expect(f.admission.getSnapshot().phase).toBe("unmounted");
    const lease = f.admission.mount();
    expect(f.counts.metadata).toBe(0);
    f.admission.disconnect(lease);
  } finally {
    f.dispose();
  }
});
it("metadata async/nonvoid validator failures stay genuine core failures, no hidden acceptance", () => {
  const f = fixture();
  try {
    const before = f.C.getSnapshot();
    f.callbacks.command = () =>
      Promise.reject(new Error("Synthetic guarded rejection"));
    expect(() =>
      f.C.dispatch({ type: "columns.order", update: ["name", "amount"] }),
    ).toThrow();
    expect(f.C.getSnapshot()).toBe(before);
  } finally {
    f.dispose();
  }
});
