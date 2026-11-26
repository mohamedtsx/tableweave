import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { actions, pagedCase } from "./fixtures.js";
import { own, requireOriginal } from "./guard.mjs";

test("literal pre-U1 paged schema/identity bytes and callback order remain exact", async () => {
  const values = Object.fromEntries(
    [undefined, true].flatMap((enabled) =>
      [false, true].flatMap((controlled) =>
        actions.map((action) => [
          `${enabled}-${controlled}-${action}`,
          pagedCase(enabled, controlled, action),
        ]),
      ),
    ),
  );
  const file = join(own, "paged-baselines.json");
  if (process.env.U1_RUN === "before-paged") {
    await requireOriginal();
    writeFileSync(file, `${JSON.stringify(values, null, 2)}\n`, { flag: "wx" });
  }
  expect(values).toEqual(JSON.parse(readFileSync(file, "utf8")));
});
