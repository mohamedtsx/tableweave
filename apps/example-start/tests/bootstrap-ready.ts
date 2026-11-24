import { expect, type Page, test } from "@playwright/test";

/** Cold Vite module loading belongs to bootstrap, not a transition SLA. */
export async function openApplication(page: Page, path = "/") {
  const started = Date.now();
  await page.goto(path);
  const navigationMs = Date.now() - started;
  // Use the existing bounded test deadline only for initial hydration. Do not
  // extend test/global expectations or mask readiness with retries or sleeps.
  await expect(page.getByTestId("hydrated")).toHaveText("hydrated", {
    timeout: test.info().timeout,
  });
  await test.info().attach("synthetic-bootstrap-timing", {
    body: JSON.stringify({
      navigationMs,
      hydrationReadyMs: Date.now() - started,
    }),
    contentType: "application/json",
  });
}
