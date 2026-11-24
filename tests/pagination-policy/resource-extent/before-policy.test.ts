import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";
import { fixture, input, requireToken, success } from "./fixtures.js";
import { own } from "./guard.mjs";

const observations: unknown[] = [];
test("explicit complete metadata survives token/snapshot and suppresses navigation", () => {
  const f = fixture(),
    raw = { ...input(), extent: { kind: "complete" }, evaluatedAt: 0 };
  const token = requireToken(Reflect.apply(f.adapter.begin, undefined, [raw]));
  f.adapter.succeed(token, success(137));
  const v = f.adapter.getSnapshot();
  observations.push({
    test: "metadata",
    tokenKeys: Reflect.ownKeys(token),
    navigable: v.canNavigate,
    actualPassed: Object.hasOwn(token, "extent") && !v.canNavigate,
  });
  expect(token).toMatchObject({ extent: { kind: "complete" }, evaluatedAt: 0 });
  expect(v.canNavigate).toBe(false);
});
for (const page of [
  { kind: "unknown", hasNextPage: false },
  { kind: "known", total: 1 },
])
  test(`complete rejects contradictory supplied records ${page.kind}`, () => {
    const f = fixture(),
      token = requireToken(
        Reflect.apply(f.adapter.begin, undefined, [
          { ...input(), extent: { kind: "complete" }, evaluatedAt: 0 },
        ]),
      );
    let rejected = false;
    try {
      f.adapter.succeed(token, { ...success(137), page } as ReturnType<
        typeof success
      >);
    } catch {
      rejected = true;
    }
    observations.push({ test: "complete-total", page, actualPassed: rejected });
    expect(rejected).toBe(true);
  });
test("success cannot add a complete extent to a legacy page token", () => {
  const f = fixture(),
    token = requireToken(f.adapter.begin(input()));
  let rejected = false;
  try {
    Reflect.apply(f.adapter.succeed, undefined, [
      token,
      { ...success(137), extent: { kind: "complete" }, evaluatedAt: 0 },
    ]);
  } catch {
    rejected = true;
  }
  observations.push({ test: "success-promotion", actualPassed: rejected });
  expect(rejected).toBe(true);
});
test("time-only metadata is rejected before changing an outstanding token", () => {
  const f = fixture(),
    token = requireToken(f.adapter.begin(input()));
  const before = f.adapter.getSnapshot();
  let rejected = false;
  try {
    Reflect.apply(f.adapter.begin, undefined, [{ ...input(), evaluatedAt: 0 }]);
  } catch {
    rejected = true;
  }
  observations.push({
    test: "time-only",
    actualPassed: rejected,
    sameSnapshot: f.adapter.getSnapshot() === before,
    priorGeneration: token.generation,
  });
  expect(rejected).toBe(true);
  expect(f.adapter.getSnapshot()).toBe(before);
});
afterAll(() =>
  writeFileSync(
    join(
      own,
      ".artifacts",
      process.env.U3_RUN ?? "units",
      "before-policy-observations.json",
    ),
    JSON.stringify(observations, null, 2),
  ),
);
