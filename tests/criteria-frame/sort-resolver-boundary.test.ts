import { expect, test } from "vitest";
import { constructSortFn } from "../../packages/react/node_modules/@tanstack/react-table/dist/index.js";
import { guardCriteriaCallback } from "../../packages/react/src/presentation/criteria-callbacks.js";
import { requireCriteriaTool } from "../../packages/react/src/presentation/criteria-frame.js";
import { fixture, required } from "./fixtures.js";

// AUTHORED, NOT RUN. Historical characterization only: the original positive
// obligation is preserved under .artifacts/original-outer-wrapper-obligation.test.ts.
// This is not the supported helper path's positive guard contract.
test("historical outer-only wrapper does not interrupt the original vendor closure", () => {
  const f = fixture();
  f.settle();
  const frame = f.commit(),
    pair = f.frames.issue(frame);
  let resolvers = 0,
    comparators = 0;
  const original = constructSortFn({
    resolveDataValue(value) {
      resolvers++;
      if (resolvers === 1) f.app.beginReset();
      return value;
    },
    sort() {
      comparators++;
      return 0;
    },
  });
  const check = () => {
    requireCriteriaTool(pair.tool, f.frames);
    return undefined;
  };
  const wrapped = guardCriteriaCallback(original, undefined, check, true);
  expect(() =>
    wrapped(
      required(frame.view.rows[0]),
      required(frame.view.rows[1]),
      "amount",
    ),
  ).toThrow();
  expect(resolvers).toBe(2);
  expect(comparators).toBe(1);
});
