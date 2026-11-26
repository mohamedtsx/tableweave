import { expect, test } from "vitest";

// Separate final-phase SSR file: no production static import before the probe.
test("cold refs-only module import needs no Node constructor", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Node");
  let reads = 0;
  Object.defineProperty(globalThis, "Node", {
    configurable: true,
    get() {
      reads++;
      throw Error("Unexpected Node read at module evaluation");
    },
  });
  try {
    const native = await import(
      "../../../packages/heroui/src/table/native-resource-lifetime.js"
    );
    expect(native.releaseNativeAttachment({})).toBeUndefined();
    expect(reads).toBe(0);
  } finally {
    if (original) Object.defineProperty(globalThis, "Node", original);
    else Reflect.deleteProperty(globalThis, "Node");
  }
});
