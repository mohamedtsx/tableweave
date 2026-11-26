// FINAL-only optional public type probe. The dedicated driver owns browser processes.
import {
  defineConfig,
  type Browser,
  type BrowserContext,
  type BrowserType,
  type Page,
} from "@playwright/test";
import type { Harness } from "./main.js";
export async function browserProbe(page: Page) {
  return page.evaluate(() => {
    const harness: Harness = window.wp14;
    return { ready: harness.ready(), result: harness.read() };
  });
}
/** Uninvoked SOURCE probe of actual pinned launch/CDP contracts, not a runner. */
export async function launchProbe(
  type: BrowserType,
  executablePath: string,
  ownedProfile: string,
  ownedArtifacts: string,
) {
  return type.launchPersistentContext(ownedProfile, {
    executablePath,
    artifactsDir: ownedArtifacts,
    chromiumSandbox: true,
    headless: true,
    acceptDownloads: false,
    serviceWorkers: "block",
    viewport: { width: 1440, height: 900 },
    args: ["--disable-extensions"],
  });
}
export async function traceProbe(
  browser: Browser,
  context: BrowserContext,
  page: Page,
) {
  const before = await browser.newBrowserCDPSession();
  const info = await before.send("SystemInfo.getProcessInfo");
  const argumentsObserved = await before.send("Browser.getBrowserCommandLine");
  await before.detach();
  const trace = await context.newCDPSession(page);
  await trace.send("Tracing.start", {
    categories:
      "devtools.timeline,blink.user_timing,disabled-by-default-devtools.screenshot",
    transferMode: "ReportEvents",
  });
  await trace.send("Tracing.end");
  await trace.detach();
  return { info, argumentsObserved };
}
export default defineConfig({
  workers: 1,
  retries: 0,
  fullyParallel: false,
  use: {
    viewport: { width: 1440, height: 900 },
    baseURL: "http://127.0.0.1:6576",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
