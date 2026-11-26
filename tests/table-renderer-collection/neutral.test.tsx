import {
  type DataTableModel,
  renderNativeComponent,
  useDataTable,
} from "@tableweave/react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { SelectionToolbar } from "../../packages/heroui/src/selection/selection-toolbar.js";
import { NativeCollection } from "../../packages/heroui/src/table/native-collection.js";
import {
  captureTableRendererProp,
  createTableRendererCell,
  getTableRendererOwner,
} from "../../packages/heroui/src/table/renderer-commit.js";
import { fixture, type Item, type S } from "./fixtures.js";

test("actual helper creates React elements without hand-calling function/Hooks bodies", () => {
  let calls = 0;
  function Body(): never {
    calls++;
    throw new Error("Must remain React-owned");
  }
  const element = renderNativeComponent(Body, {});
  expect(calls).toBe(0);
  expect(element).toMatchObject({ type: Body });
});
test("genuine uncommitted issued model gives only inert provenance, never collection readiness", () => {
  const f = fixture();
  let model: DataTableModel<S, Item> | null = null;
  function View() {
    model = useDataTable(f.D, f.options());
    return null;
  }
  renderToString(<View />);
  if (!model) throw 0;
  const cell = createTableRendererCell(model);
  expect(getTableRendererOwner(cell)?.controller).toBe(f.app.C);
  expect(captureTableRendererProp({ renderer: { cell, actor: {} } }).kind).toBe(
    "denied",
  );
});
test("supplied-invalid metadata denies SSR before any alleged private field/getter", () => {
  let reads = 0;
  for (const renderer of [null, undefined, {}, { cell: {}, actor: {} }]) {
    const input = Object.defineProperties(
      { renderer },
      {
        view: {
          get() {
            reads++;
            throw 0;
          },
        },
        presentation: {
          get() {
            reads++;
            throw 0;
          },
        },
        messages: {
          get() {
            reads++;
            throw 0;
          },
        },
        actions: {
          get() {
            reads++;
            throw 0;
          },
        },
      },
    );
    // Direct invocation exercises ONLY the library-owned hook-free dispatch gate;
    // no arbitrary app/native React component is hand-called.
    expect(NativeCollection(input as never)).toBeNull();
    expect(SelectionToolbar(input as never)).toBeNull();
  }
  const inherited = Object.create({ renderer: {} });
  const accessor = Object.defineProperty({}, "renderer", {
    get() {
      reads++;
      throw 0;
    },
  });
  expect(captureTableRendererProp(inherited).kind).toBe("denied");
  expect(captureTableRendererProp(accessor).kind).toBe("denied");
  expect(reads).toBe(0);
});
