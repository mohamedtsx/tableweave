import { expect, test } from "vitest";
import { parseQuery } from "@tableweave/react/contracts";
import { minimalTransactionSchema } from "../../../apps/examples/shared/schemas.js";
import { buildInitialPayload } from "../../../apps/example-next/lib/server-contract.js";
import { GET } from "../../../apps/example-next/app/headless/route.js";

test("fresh public request envelopes preserve UTC/query/array/null/finite input data", () => {
  const first = buildInitialPayload("primary"),
    second = buildInitialPayload("comparison");
  expect(first.rows).toHaveLength(24);
  expect(first).not.toBe(second);
  expect(first.rows).not.toBe(second.rows);
  expect(first.rows[0]).not.toBe(second.rows[0]);
  expect(first.rows[0]?.tags).not.toBe(second.rows[0]?.tags);
  expect(first.rows[0]?.reference).toBeNull();
  expect(first.rows[0]?.cleared).toBeNull();
  expect(
    first.rows.every(
      (row) =>
        Number.isFinite(row.amount) &&
        typeof row.id === "string" &&
        Array.isArray(row.tags),
    ),
  ).toBe(true);
  expect(first.locale).toBe("en-US");
  expect(first.timeZone).toBe("UTC");
  expect(first.evaluatedAt).toBe(Date.parse("2026-11-25T12:00:00Z"));
  expect(parseQuery(minimalTransactionSchema, first.query).success).toBe(true);
  expect(JSON.parse(JSON.stringify(first))).toEqual(first);
});
test("real headless GET builds independently for concurrent public requests, without cache or auth claims", async () => {
  const [first, second] = await Promise.all([
    GET(new Request("http://example.invalid/headless?instance=primary")),
    GET(new Request("http://example.invalid/headless?instance=comparison")),
  ]);
  expect(first.headers.get("cache-control")).toBe("no-store");
  expect(second.headers.get("cache-control")).toBe("no-store");
  const a: unknown = await first.json(),
    b: unknown = await second.json();
  expect(a).toEqual(buildInitialPayload("primary"));
  expect(b).toEqual(buildInitialPayload("comparison"));
  expect(
    GET(new Request("http://example.invalid/headless?instance=unknown")).status,
  ).toBe(400);
});
