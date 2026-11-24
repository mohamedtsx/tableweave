import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import type { NativeInput } from "../../../packages/react/src/tanstack/types.js";
import type { Item } from "./fixtures.js";
import { observation, records, setup } from "./fixtures.js";
import { own, requireOriginal } from "./guard.mjs";

test("literal original paged native pipeline/options/selection/navigation and phase changes", async () => {
  const cases: Record<string, unknown> = {};
  const inputs: NativeInput<Item>[] = [
    { mode: "client", records },
    {
      mode: "server",
      records: records.slice(0, 4),
      pageInfo: { kind: "known", total: 80 },
    },
    {
      mode: "server",
      records: records.slice(0, 4),
      pageInfo: { kind: "unknown", hasNextPage: false },
    },
    {
      mode: "server",
      records: records.slice(0, 4),
      pageInfo: { kind: "unknown", hasNextPage: true },
    },
  ];
  for (const enabled of [undefined, true])
    for (const custom of [false, true]) {
      for (const [index, input] of inputs.entries())
        for (const pageIndex of [0, 1]) {
          const f = setup(enabled, custom, "multiple", pageIndex),
            m = f.mount(input),
            view = m.view();
          const before = observation(f, input, m);
          view.selectPage(true);
          m.table.setOptions(f.adapter.getOptions(input));
          const selected = observation(f, input, m);
          const fresh = m.view();
          fresh.nextPage();
          const afterNext =
            f.controller.getSnapshot().query.pagination.pageIndex;
          f.adapter
            .getView(m.native, input, f.controller.getSnapshot())
            .previousPage();
          cases[`${enabled}-${custom}-${index}-${pageIndex}`] = {
            before,
            selected,
            afterNext,
            afterPrevious:
              f.controller.getSnapshot().query.pagination.pageIndex,
          };
        }
      const f = setup(enabled, custom),
        m = f.mount(inputs[0] as NativeInput<Item>);
      cases[`phases-${enabled}-${custom}`] = [
        inputs[1],
        inputs[2],
        inputs[0],
        inputs[1],
      ].map((input) => observation(f, input as NativeInput<Item>, m));
    }
  const raw = join(own, ".artifacts/paged-baselines.raw.json");
  if (process.env.U2_RUN === "before-paged") {
    await requireOriginal();
    writeFileSync(raw, `${JSON.stringify(cases, null, 2)}\n`, { flag: "wx" });
  }
  expect(cases).toEqual(
    JSON.parse(
      readFileSync(
        process.env.U2_RUN === "before-paged"
          ? raw
          : join(own, "paged-baselines.json"),
        "utf8",
      ),
    ),
  );
});
