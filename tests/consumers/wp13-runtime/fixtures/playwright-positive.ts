// Positive public-API source probe only. Never invoked. This does NOT type-check
// the runtime MJS implementation or prove real browser/SDK execution.
import type { BrowserContext, Page } from "@playwright/test";

export async function launchSurface(
  chromium: typeof import("@playwright/test").chromium,
  executablePath: string,
  temporaryDirectory: string,
) {
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    timeout: 30000,
    env: { TMPDIR: temporaryDirectory, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1" },
  });
  const context = await browser.newContext({
    locale: "en-US",
    timezoneId: "UTC",
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: false,
    serviceWorkers: "block",
  });
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin === "http://127.0.0.1:6575")
      await route.continue();
    else await route.abort();
  });
  await context.routeWebSocket("**/*", (socket) => socket.close());
  await context.close();
  await browser.close();
}
export async function observationSurface(
  page: Page,
  context: BrowserContext,
  expect: typeof import("@playwright/test").expect,
) {
  page.setDefaultTimeout(15000);
  page.on("console", (message) => message.type());
  page.on("pageerror", (error) => error.message);
  const result = await context.request.get("http://127.0.0.1:6575/", {
    maxRedirects: 0,
    timeout: 30000,
    headers: { RSC: "1" },
  });
  const body: string = await result.text();
  const status: number = result.status();
  await expect.poll(() => status, { timeout: 10000 }).toBe(200);
  const locator = page.getByRole("rowheader", {
    name: "Transfer note 11",
    exact: true,
  });
  await expect(locator).toBeVisible({ timeout: 30000 });
  const visible: boolean = await locator.isVisible();
  const rows: number = await page.locator("tbody tr").count();
  const style = await page.locator(".tw-data-table").evaluate((element) => ({
    display: getComputedStyle(element).display,
    gap: parseFloat(getComputedStyle(element).columnGap),
  }));
  return { body, status, visible, rows, style };
}
