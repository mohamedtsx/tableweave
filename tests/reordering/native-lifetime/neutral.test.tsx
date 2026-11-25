import { useDataTable } from "@tableweave/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import {
  claimRendererNativeInstall,
  createDetailsCommitCore,
  createRendererCommitCore,
  createToolCommitCore,
} from "../../../packages/heroui/src/filters/criteria-commit-core.js";
import {
  installRendererNativeLifetime,
  issueNativeScope,
  nativeRefStatus,
  releaseNativeAttachment,
} from "../../../packages/heroui/src/table/native-resource-lifetime.js";
import { createTableRendererCell } from "../../../packages/heroui/src/table/renderer-commit.js";
import { fixture } from "../../data-table/shell/fixtures.js";

const baseKeys = [
  "kind",
  "getSnapshot",
  "subscribe",
  "connect",
  "commit",
  "require",
  "disconnect",
  "createLocal",
  "timeout",
  "animationFrame",
  "cancelWork",
];

test("genuine uncommitted models create only inert frozen owners, with unchanged own keys", () => {
  const f = fixture(false, true);
  function View() {
    const model = useDataTable(f.D, f.options());
    const before = f.app.P.getSnapshot();
    const selection = f.app.C.getSnapshot().selection;
    const cells = [
      createTableRendererCell(model),
      createRendererCommitCore(model),
      createDetailsCommitCore(model),
      createToolCommitCore("search", f.app.C),
    ];
    for (const [index, cell] of cells.entries()) {
      expect(Object.isFrozen(cell)).toBe(true);
      expect(Object.getPrototypeOf(cell)).toBe(Object.prototype);
      const keys = [...baseKeys, ...(index < 3 ? ["updateModel"] : [])];
      expect(Reflect.ownKeys(cell)).toEqual(keys);
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(cell, key);
        expect(descriptor).toEqual(
          expect.objectContaining({
            configurable: false,
            enumerable: true,
            writable: false,
          }),
        );
      }
      expect(cell.getSnapshot().actor).toBeNull();
      expect(() => installRendererNativeLifetime(cell, {})).toThrow();
    }
    expect(f.app.P.getSnapshot()).toBe(before);
    expect(f.app.C.getSnapshot().selection).toBe(selection);
    expect(claimRendererNativeInstall(cells[0], {})).toBeNull();
    expect(() =>
      issueNativeScope({ cell: cells[1], actor: {} } as never),
    ).toThrow();
    return <output>{model.phase}</output>;
  }
  expect(renderToString(createElement(View))).toBe(
    "<output>uncommitted</output>",
  );
  f.dispose();
});

test("fake seeds/cells/tickets never traverse alleged fields or install policy", () => {
  let reads = 0;
  const fake = new Proxy(
    {},
    {
      get() {
        reads++;
        throw Error("private");
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw Error("private");
      },
    },
  );
  expect(claimRendererNativeInstall(fake, fake)).toBeNull();
  expect(() => installRendererNativeLifetime(fake, fake)).toThrow();
  expect(nativeRefStatus(fake)).toBe("ended");
  expect(releaseNativeAttachment(fake)).toBeUndefined();
  expect(reads).toBe(0);
});

test("SSR constructor does not consult DOM globals or native resources", () => {
  const f = fixture(false, false);
  function View() {
    const model = useDataTable(f.D, f.options());
    const saved = Object.getOwnPropertyDescriptor(globalThis, "Node");
    let reads = 0;
    Object.defineProperty(globalThis, "Node", {
      configurable: true,
      get() {
        reads++;
        throw Error("DOM read at construction");
      },
    });
    try {
      const cell = createTableRendererCell(model);
      expect(cell.getSnapshot().actor).toBeNull();
      expect(reads).toBe(0);
    } finally {
      if (saved) Object.defineProperty(globalThis, "Node", saved);
      else Reflect.deleteProperty(globalThis, "Node");
    }
    return null;
  }
  expect(renderToString(<View />)).toBe("");
  f.dispose();
});
