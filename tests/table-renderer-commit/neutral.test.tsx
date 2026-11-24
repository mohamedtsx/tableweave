import { type DataTableModel, useDataTable } from "@tableweave/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { createTableRendererCell } from "../../packages/heroui/src/table/renderer-commit.js";
import {
  fixture,
  type Item,
  required,
  type Schema,
} from "../table-facade/hook/fixtures.js";

function neutral() {
  const f = fixture();
  let model: DataTableModel<Schema, Item> | null = null;
  function View() {
    model = useDataTable(f.D, f.options());
    return createElement("output", null, model.phase);
  }
  expect(renderToString(createElement(View))).toBe(
    "<output>uncommitted</output>",
  );
  return { f, model: required<DataTableModel<Schema, Item>>(model) };
}
test("genuine uncommitted model permits inert provenance/empty core, never candidate capture/readiness", () => {
  const { f, model } = neutral();
  const cell = createTableRendererCell(model);
  let calls = 0;
  expect(cell.getSnapshot().actor).toBeNull();
  expect(f.app.C.getSnapshot().selection).toEqual({ initial: true });
  const lease = cell.connect();
  const candidate = Object.defineProperty({}, "renderState", {
    get() {
      calls++;
      throw 0;
    },
  });
  expect(() => cell.commit(lease, model, candidate)).toThrow(
    expect.objectContaining({ code: "table.renderer.unavailable" }),
  );
  expect(calls).toBe(0);
  expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
  cell.disconnect(lease);
  expect(f.app.C.isDisposed()).toBe(false);
});
test("unknown/copied/proxied models reject before all alleged private getters", () => {
  const { model } = neutral();
  let reads = 0;
  const proxy = new Proxy(model, {
    get() {
      reads++;
      throw 0;
    },
    getOwnPropertyDescriptor() {
      reads++;
      throw 0;
    },
  });
  for (const bad of [{ ...model }, proxy, {}])
    expect(() => createTableRendererCell(bad as never)).toThrow();
  expect(reads).toBe(0);
});
