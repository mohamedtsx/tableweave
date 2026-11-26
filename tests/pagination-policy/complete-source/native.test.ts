import { expect, test } from "vitest";
import type { NativeInput } from "../../../packages/react/src/tanstack/types.js";
import { fixture, records } from "./fixtures.js";

for (const enabled of [false, true])
  for (const mode of ["client", "server", "server-complete"] as const)
    for (const empty of [false, true])
      for (const owner of [1, 2])
        test(`native policy=${enabled}/${mode}/empty=${empty}/owner=${owner}`, () => {
          const f = fixture(enabled, { filtered: true, sorted: true }),
            data = empty ? [] : records.slice(0, 137).reverse();
          const input: NativeInput<(typeof records)[number]> =
            mode === "client"
              ? { mode, records: data }
              : {
                  mode,
                  records: data,
                  pageInfo: { kind: "known", total: data.length },
                };
          const admitted =
            mode === "client" ||
            (enabled ? mode === "server" : mode === "server-complete");
          if (!admitted) {
            expect(() =>
              f.boundary.prepare(input, f.controller.getSnapshot()),
            ).toThrow(expect.objectContaining({ code: "native.page" }));
            expect(f.calls.rowId).toBe(0);
            expect(f.calls.eligible).toBe(0);
            expect(f.calls.predicate).toBe(0);
            return;
          }
          const native = f.native(input),
            options = native.visibleColumns[0]?.table.options;
          expect(options?.manualFiltering).toBe(mode !== "client");
          expect(options?.manualSorting).toBe(mode !== "client");
          expect(options?.manualPagination).toBe(mode !== "client" || !enabled);
          expect(native.pagination.enabled).toBe(enabled);
          if (mode === "server-complete") {
            expect(native.rows.map((row) => row.original)).toEqual(data);
            expect(native.pagination.pageCount).toBeNull();
            expect(options?.rowCount).toBe(data.length);
            expect(Object.hasOwn(options ?? {}, "pageCount")).toBe(true);
            expect(options?.pageCount).toBeUndefined();
            expect(f.calls.predicate).toBe(0);
            expect(f.calls.accessor).toBe(0);
          }
        });
for (const malformed of [
  "unknown",
  "total",
  "negative",
  "sparse",
  "null",
  "index-getter",
] as const)
  test(`complete ${malformed} denies before private callbacks`, () => {
    const f = fixture(),
      data: unknown[] = [...records.slice(0, 3)];
    let reads = 0;
    const page: unknown =
      malformed === "unknown"
        ? { kind: "unknown", hasNextPage: false }
        : {
            kind: "known",
            total:
              malformed === "total" ? 4 : malformed === "negative" ? -1 : 3,
          };
    if (malformed === "sparse") delete data[0];
    if (malformed === "null") data[0] = null;
    if (malformed === "index-getter")
      Object.defineProperty(data, "0", {
        get() {
          reads++;
          return records[0];
        },
      });
    expect(() =>
      Reflect.apply(f.boundary.prepare, undefined, [
        { mode: "server-complete", records: data, pageInfo: page },
        f.controller.getSnapshot(),
      ]),
    ).toThrow(
      expect.objectContaining({
        code: ["unknown", "total", "negative"].includes(malformed)
          ? "native.page"
          : "native.rows",
      }),
    );
    expect(f.calls.rowId).toBe(0);
    expect(f.calls.predicate).toBe(0);
    expect(f.calls.eligible).toBe(0);
    expect(reads).toBe(0);
  });
test("boundary captures mode, records and page once and refuses unknown modes", () => {
  const f = fixture(),
    reads = { mode: 0, records: 0, page: 0 };
  const raw = {
    get mode() {
      reads.mode++;
      return reads.mode === 1 ? "server-complete" : "client";
    },
    get records() {
      reads.records++;
      return records;
    },
    get pageInfo() {
      reads.page++;
      return { kind: "known", total: records.length };
    },
  };
  const frame = Reflect.apply(f.boundary.prepare, undefined, [
    raw,
    f.controller.getSnapshot(),
  ]);
  expect(frame.input.mode).toBe("server-complete");
  expect(reads).toEqual({ mode: 1, records: 1, page: 1 });
  expect(() =>
    Reflect.apply(f.boundary.prepare, undefined, [
      {
        mode: "unknown",
        records,
        get pageInfo() {
          throw new Error("Unrecognized modes must not read page");
        },
      },
      f.controller.getSnapshot(),
    ]),
  ).toThrow(expect.objectContaining({ code: "native.rows" }));
});
test("disabled real client filtering/sorting remains unsliced above100", () => {
  const f = fixture(false, { filtered: true, sorted: true }),
    input = f.client(),
    facts = f.project(input);
  expect(input.native.rows).toHaveLength(148);
  expect(facts.displayed?.pageInfo).toEqual({ kind: "known", total: 148 });
  expect(facts.displayed?.range).toEqual({ from: 1, to: 148 });
  expect(facts.canSelect).toBe(true);
  expect(facts.blockedReason).toBeNull();
  expect(facts.canNavigate).toBe(false);
});
test("enabled unknown server keeps -1, known server keeps page math, client clears totals", () => {
  const f = fixture(true),
    unknown = f.adapter.getOptions({
      mode: "server",
      records: [],
      pageInfo: { kind: "unknown", hasNextPage: true },
    }),
    known = f.adapter.getOptions({
      mode: "server",
      records: [],
      pageInfo: { kind: "known", total: 51 },
    }),
    client = f.adapter.getOptions({ mode: "client", records });
  expect(unknown.pageCount).toBe(-1);
  expect(unknown.rowCount).toBeUndefined();
  expect(known.pageCount).toBe(3);
  expect(known.rowCount).toBe(51);
  expect(Object.hasOwn(client, "rowCount")).toBe(true);
  expect(Object.hasOwn(client, "pageCount")).toBe(true);
  expect(client.rowCount).toBeUndefined();
  expect(client.pageCount).toBeUndefined();
});
