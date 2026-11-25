import { expect, test } from "@playwright/test";
test("actual SSR serializes isolated Alpha/Beta canaries, with no DOM table grant", async ({
  browser,
  request,
}) => {
  const [alpha, beta] = await Promise.all([
    request.get("/", { headers: { Cookie: "wp11-facade-dataset=alpha" } }),
    request.get("/", { headers: { Cookie: "wp11-facade-dataset=beta" } }),
  ]);
  expect(alpha.ok()).toBe(true);
  expect(beta.ok()).toBe(true);
  const [a, b] = await Promise.all([alpha.text(), beta.text()]);
  expect(a).toContain("public-canary:alpha:");
  expect(a).not.toContain("public-canary:beta:");
  expect(b).toContain("public-canary:beta:");
  expect(b).not.toContain("public-canary:alpha:");
  expect(a).not.toContain("WP11_START_FACADE_READER_SERVER_ONLY");
  expect(b).not.toContain("WP11_START_FACADE_READER_SERVER_ONLY");
  const noScripts = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await noScripts.newPage();
    await page.goto("/");
    await expect(page.getByRole("table")).toHaveCount(0);
  } finally {
    await noScripts.close();
  }
});
test("fresh hydration has no new RPC, while explicit refresh does", async ({
  page,
}) => {
  const rpc: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/_serverFn/")) rpc.push(request.method());
  });
  const response = await page.goto("/");
  await expect(
    page.getByRole("rowheader", {
      name: "Alpha Transfer note 01",
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("rowheader", { name: "Alpha Desk stand", exact: true }),
  ).toBeVisible();
  const date = response?.headers().date;
  expect(
    date,
    "Actual response Date required to establish fresh-cache precondition",
  ).toBeTruthy();
  expect(
    Date.now() - Date.parse(date ?? ""),
    "Cold hydration outside freshness window is not duplicate-FRESH proof",
  ).toBeLessThan(30000);
  expect(rpc).toHaveLength(0);
  await page
    .getByRole("region", { name: "Synthetic transactions", exact: true })
    .getByRole("button", { name: "Refresh synthetic records" })
    .click();
  await expect.poll(() => rpc.length).toBeGreaterThan(0);
});
test("two real table owners: independent query, selection and UI-hide lifetime", async ({
  page,
}) => {
  await page.goto("/");
  const transactions = page.getByRole("region", {
    name: "Synthetic transactions",
    exact: true,
  });
  const inventory = page.getByRole("region", {
    name: "Synthetic inventory",
    exact: true,
  });
  await expect(
    transactions.getByRole("rowheader", {
      name: "Alpha Transfer note 01",
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  await transactions
    .getByRole("checkbox", {
      name: "Select Alpha Transfer note 01",
      exact: true,
    })
    .check();
  await expect(transactions.getByLabel("Selected count")).toContainText(
    "1 selected",
  );
  await page
    .getByRole("button", { name: "Hide table UI", exact: true })
    .click();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Show table UI", exact: true })
    .click();
  await expect(transactions.getByLabel("Selected count")).toContainText(
    "1 selected",
  );
  await transactions
    .getByRole("textbox", { name: "Search records", exact: true })
    .fill("Transfer note 11");
  await transactions
    .getByRole("button", { name: "Apply search", exact: true })
    .click();
  await expect(
    transactions.getByRole("rowheader", {
      name: "Alpha Transfer note 11",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    inventory.getByRole("rowheader", { name: "Alpha Desk stand", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Revoke local source", exact: true })
    .click();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByLabel("Synthetic canary")).toHaveCount(0);
});
test("actual source transition/leave requests fresh Beta then Alpha ownership", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("rowheader", { name: "Alpha Desk stand", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page
    .getByRole("button", { name: "Load Beta synthetic source" })
    .click();
  await expect(
    page.getByRole("rowheader", { name: "Beta Desk stand", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("rowheader", { name: "Alpha Desk stand", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Leave application route" }).click();
  await expect(
    page.getByRole("heading", { name: "Outside the table application" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Request a fresh source" }).click();
  await expect(
    page.getByRole("rowheader", { name: "Beta Desk stand", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Load Alpha synthetic source" })
    .click();
  await expect(
    page.getByRole("rowheader", { name: "Alpha Desk stand", exact: true }),
  ).toBeVisible();
});
test("genuine typed server denial during refresh clears both sources", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("rowheader", { name: "Alpha Desk stand", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await context.addCookies([
    {
      name: "wp11-facade-availability",
      value: "closed",
      url: "http://127.0.0.1:6573",
    },
  ]);
  await page
    .getByRole("region", { name: "Synthetic transactions", exact: true })
    .getByRole("button", { name: "Refresh synthetic records" })
    .click();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByLabel("Synthetic canary")).toHaveCount(0);
});
test("in-flight old response cannot resurrect rows after local loss", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("rowheader", { name: "Alpha Desk stand", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    await held;
    await route.fulfill({ response });
  });
  await page
    .getByRole("region", { name: "Synthetic transactions", exact: true })
    .getByRole("button", { name: "Refresh synthetic records" })
    .click();
  await page
    .getByRole("button", { name: "Revoke local source", exact: true })
    .click();
  release?.();
  await page.unrouteAll({ behavior: "wait" });
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByLabel("Synthetic canary")).toHaveCount(0);
});
