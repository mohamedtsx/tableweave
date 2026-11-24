import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import {
  canonicalJson,
  createQuery,
  getFilterIdentity,
  getQueryIdentity,
} from "../../../packages/react/src/contracts/index.js";
import { defineController } from "../../../packages/react/src/controller/validation.js";
import { active, context, customSizes, now, schemaFor } from "./fixtures.js";
import { four, original, own } from "./guard.mjs";

it("captures real paged bytes only while all four original producer inputs match", async () => {
  expect(await four()).toEqual(original);
  const cases = Object.fromEntries(
    [undefined, customSizes].map((pagination, index) => {
      const schema = schemaFor(pagination);
      const neutral = createQuery(schema, context);
      const filtered = createQuery(schema, active(schema));
      const controller = defineController({
        schema,
        columns: [{ id: "amount" }, { id: "title" }],
        selection: true,
      });
      return [
        index ? "custom" : "defaults",
        {
          schema: canonicalJson(schema),
          controller: canonicalJson(controller),
          defaultWire: canonicalJson(neutral),
          activeWire: canonicalJson(filtered),
          defaultFilterIdentity: getFilterIdentity(schema, neutral, { now }),
          activeFilterIdentity: getFilterIdentity(schema, filtered, { now }),
          defaultQueryIdentity: getQueryIdentity(schema, neutral, { now }),
          activeQueryIdentity: getQueryIdentity(schema, filtered, { now }),
        },
      ];
    }),
  );
  writeFileSync(
    join(own, ".artifacts/pre-change/observed.json"),
    `${JSON.stringify({ original, cases }, null, 2)}\n`,
    { flag: "wx" },
  );
  expect(await four()).toEqual(original);
  expect(
    readFileSync(join(own, ".artifacts/pre-change/original-four.json"), "utf8"),
  ).toBe(JSON.stringify(original, null, 2));
});
