import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";
import { NativeBridgeError } from "../../../packages/react/src/tanstack/definition.js";
import { expected, records, setup } from "./fixtures.js";
import { own } from "./guard.mjs";

const observations: unknown[] = [];
for (const custom of [false, true])
  test(`real disabled native final model is unsliced for173 records, custom=${custom}`, () => {
    const f = setup(false, custom),
      m = f.mount({ mode: "client", records }),
      view = m.view();
    const actual = view.native.getRowModel().rows.map((row) => row.id),
      wanted = expected(records);
    observations.push({
      kind: "unslicing",
      custom,
      input: records.length,
      actual,
      expected: wanted,
      actualPassed:
        actual.length === wanted.length &&
        actual.every((id, i) => id === wanted[i]),
    });
    expect(wanted.length).toBeGreaterThan(100);
    expect(actual).toEqual(wanted);
    expect(view.rows).toBe(m.table.getRowModel().rows);
    expect(m.table.getRowModel()).toBe(m.table.getSortedRowModel());
  });
for (const count of [0, 1, 173])
  test(`false ordinary server count=${count} denies before private callbacks`, () => {
    const f = setup(false);
    let code: unknown;
    try {
      f.adapter.getOptions({
        mode: "server",
        records: records.slice(0, count),
        pageInfo: { kind: "known", total: count },
      });
    } catch (error) {
      code = error instanceof NativeBridgeError ? error.code : "unexpected";
    }
    observations.push({
      kind: "server-denial",
      count,
      code,
      counts: { ...f.counts },
      actualPassed:
        code === "native.page" && Object.values(f.counts).every((n) => n === 0),
    });
    expect(code).toBe("native.page");
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
  });
afterAll(() =>
  writeFileSync(
    join(own, ".artifacts", process.env.U2_RUN ?? "units", "observations.json"),
    JSON.stringify(observations, null, 2),
  ),
);
