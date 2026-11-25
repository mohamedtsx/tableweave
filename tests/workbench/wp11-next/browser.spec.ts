import { expect, test } from "@playwright/test";

test("real Next initial HTML contains a neutral facade, not a server row table", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain('data-instance="primary"');
  expect(html).not.toMatch(/<table(?:\s|>)/);
  // Serialized Flight records may occur in scripts. Their presence is NOT SSR rows.
  expect(html).toContain('role="status"');
});

test("actual Next RSC payload hydrates the production facade and preserves its owner across optional UI", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const source = page.locator('[data-instance="primary"]');
  await expect(source.getByRole("table")).toBeVisible();
  await expect(source.locator("tbody tr")).toHaveCount(10);
  await source.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(source.getByText(/Accepted query page: 2\./)).toBeVisible();
  await source.getByRole("button", { name: "Hide table", exact: true }).click();
  await expect(source.getByRole("table")).toHaveCount(0);
  await source.getByRole("button", { name: "Show table", exact: true }).click();
  await expect(source.getByRole("table")).toBeVisible();
  await expect(source.getByText(/Accepted query page: 2\./)).toBeVisible();
  expect(errors).toEqual([]);
});
test("two real Next client boundaries do not share accepted state or source retirement", async ({
  page,
}) => {
  await page.goto("/?compare=1");
  const first = page.locator('[data-instance="primary"]'),
    second = page.locator('[data-instance="comparison"]');
  await expect(first.getByRole("table")).toBeVisible();
  await expect(second.getByRole("table")).toBeVisible();
  await first.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(first.getByText(/Accepted query page: 2\./)).toBeVisible();
  await expect(second.getByText(/Accepted query page: 1\./)).toBeVisible();
  await first
    .getByRole("button", { name: "Revoke example source", exact: true })
    .click();
  await expect(first.getByRole("table")).toHaveCount(0);
  await expect(second.getByRole("table")).toBeVisible();
  await expect(
    first.getByRole("button", { name: "Show table", exact: true }),
  ).toHaveCount(0);
});
test("actual HTTP headless route has independent public payloads and no-store metadata", async ({
  request,
}) => {
  const [a, b] = await Promise.all([
    request.get("/headless?instance=primary"),
    request.get("/headless?instance=comparison"),
  ]);
  expect(a.ok()).toBe(true);
  expect(b.ok()).toBe(true);
  expect(a.headers()["cache-control"]).toContain("no-store");
  const first: unknown = await a.json(),
    second: unknown = await b.json();
  expect(first).toMatchObject({
    kind: "public-synthetic-initial-input",
    instance: "primary",
    timeZone: "UTC",
  });
  expect(second).toMatchObject({
    kind: "public-synthetic-initial-input",
    instance: "comparison",
    timeZone: "UTC",
  });
  expect((await request.get("/headless?instance=unsupported")).status()).toBe(
    400,
  );
});
