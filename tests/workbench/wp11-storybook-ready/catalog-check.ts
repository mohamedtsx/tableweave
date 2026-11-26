import { expect, test } from "@playwright/test";
import { expectedIds } from "./catalog.js";

// Imported BEFORE the old spec so this registers the first test, not a second sweep.
test("actual static index and live Chromium identity", async ({
  request,
  browser,
  page,
}, testInfo) => {
  const response = await request.get("/index.json");
  expect(response.status()).toBe(200);
  const raw = await response.text();
  await testInfo.attach("actual-index.json", {
    body: raw,
    contentType: "application/json",
  });
  const index = JSON.parse(raw) as {
    entries: Record<string, { id: string; type: string; importPath: string }>;
  };
  expect(index.entries).toBeTruthy();
  const entries = Object.entries(index.entries).filter(
    ([, entry]) => entry.type === "story",
  );
  expect(entries).toHaveLength(53);
  expect(entries.map(([key]) => key).sort()).toEqual(expectedIds);
  expect(entries.map(([, entry]) => entry.id).sort()).toEqual(expectedIds);
  expect(new Set(entries.map(([, entry]) => entry.importPath)).size).toBe(9);
  const session = await page.context().newCDPSession(page);
  try {
    const cdp = await session.send("Browser.getVersion");
    const identity = {
      browserType: browser.browserType().name(),
      version: browser.version(),
      cdp,
    };
    await testInfo.attach("live-browser-version.json", {
      body: JSON.stringify(identity, null, 2),
      contentType: "application/json",
    });
    expect(identity.browserType).toBe("chromium");
    expect(identity.version.length).toBeGreaterThan(0);
    expect(cdp.product.length).toBeGreaterThan(0);
    expect(cdp.revision.length).toBeGreaterThan(0);
  } finally {
    await session.detach();
  }
});
