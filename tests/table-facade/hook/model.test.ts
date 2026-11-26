import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { assertTableController } from "../../../packages/react/src/table/definition.js";
import type {
  DataTableModel,
  DataTableOptions,
} from "../../../packages/react/src/table/types.js";
import {
  assertDataTableModel,
  getDataTableModelOwner,
  requireDataTableModel,
  useDataTable,
} from "../../../packages/react/src/table/use-data-table.js";
import { createNativeController } from "../../../packages/react/src/tanstack/definition.js";
import { fixture, type Item, required, type Schema } from "./fixtures.js";

function server(
  f: ReturnType<typeof fixture>,
  options: DataTableOptions<Schema, Item> = f.options(),
  definition = f.D,
) {
  let model: DataTableModel<Schema, Item> | null = null;
  function View() {
    model = useDataTable(definition, options);
    return createElement("output", null, model.phase);
  }
  const html = renderToString(createElement(View));
  return { model: required<DataTableModel<Schema, Item>>(model), html };
}
test("real D-factory C definition ref, initial IDs and exact pending receipt survive inert SSR/prelayout", () => {
  const f = fixture(true, "custom", true),
    before = f.app.C.getSnapshot(),
    receipt = f.app.pending;
  expect(assertTableController(f.D, f.app.C)).toBe(f.app.CD);
  expect(f.app.CD).not.toBe(f.D.native.controllerDefinition);
  let privateReads = 0;
  f.faults.onPrivate = () => {
    privateReads++;
    throw new Error("Private work during SSR");
  };
  const { model, html } = server(f);
  expect(() => assertDataTableModel(model)).not.toThrow();
  expect(html).toBe("<output>uncommitted</output>");
  expect(model.frame).toBeNull();
  expect(model.sourceTarget).toBeNull();
  expect(model.toolTarget).toBeNull();
  expect(model.definition).toBe(f.D);
  expect(model.controller).toBe(f.app.C);
  expect(model.state).toBe(before);
  expect(f.app.C.getSnapshot().selection).toEqual({ initial: true });
  expect(f.app.pending).toBe(receipt);
  expect(f.app.counts.reset).toBe(0);
  expect(f.app.P.getSnapshot().phase).toBe("blocked");
  expect(privateReads).toBe(0);
  expect(getDataTableModelOwner(model)).toEqual({
    definition: f.D,
    controller: f.app.C,
  });
  expect(requireDataTableModel(model, f.D)).toBe(model);
});
test("unknown/copied/proxied/same-schema foreign D/C reject before private payload or alleged C readers", () => {
  const f = fixture(),
    g = fixture();
  let reads = 0;
  const poison = new Proxy(
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
  const input = Object.defineProperty({ ...f.options() }, "source", {
    get() {
      reads++;
      throw 0;
    },
  });
  for (const definition of [{}, { ...f.D }, new Proxy(f.D, {}), poison])
    expect(server(f, input, definition as never).model.phase).toBe(
      "unavailable",
    );
  const raw = createNativeController(f.D.native, {
    initial: { query: f.app.C.getSnapshot().query },
    now: () => 0,
  });
  for (const controller of [poison, new Proxy(f.app.C, {}), g.app.C, raw])
    expect(
      server(f, {
        ...f.options(),
        controller,
        get source() {
          reads++;
          throw 0;
        },
      } as never).model.phase,
    ).toBe("unavailable");
  expect(reads).toBe(0);
});
test("P binding is checked before alleged publication ports; source/records are never render inputs", () => {
  const f = fixture();
  let reads = 0;
  const publication = new Proxy(f.app.P, {
    get() {
      reads++;
      throw 0;
    },
    getOwnPropertyDescriptor() {
      reads++;
      throw 0;
    },
  });
  expect(server(f, { ...f.options(), publication }).model.phase).toBe(
    "unavailable",
  );
  const input = {
    ...f.options(),
    get source(): DataTableOptions<Schema, Item>["source"] {
      reads++;
      throw 0;
    },
  };
  expect(server(f, input).model.phase).toBe("uncommitted");
  expect(reads).toBe(0);
});
test("model issuance is not structural proof; unknown/copy/proxy and foreign owner checks precede payload", () => {
  const f = fixture(),
    g = fixture();
  const { model } = server(f);
  let reads = 0;
  const poison = new Proxy(
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
  for (const candidate of [{ ...model }, new Proxy(model, {}), poison]) {
    expect(getDataTableModelOwner(candidate as never)).toBeNull();
    expect(() => assertDataTableModel(candidate as never)).toThrow();
    expect(() =>
      requireDataTableModel<Schema, Item>(candidate as never, f.D),
    ).toThrow(expect.objectContaining({ code: "table.model.unavailable" }));
  }
  expect(() => requireDataTableModel(model, g.D)).toThrow();
  expect(reads).toBe(0);
});
