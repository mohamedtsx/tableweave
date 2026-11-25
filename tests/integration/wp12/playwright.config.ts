import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const run = process.env.WP12_RUN;
if (!run || !/^[a-zA-Z0-9-]{1,64}$/.test(run))
  throw new Error("Select a fresh WP12_RUN before final runtime");
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 90_000,
  outputDir: `./evidence/.runtime/${run}/browser-results`,
  reporter: [
    ["line"],
    [
      "html",
      { outputFolder: `./evidence/.runtime/${run}/report`, open: "never" },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:6574",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: {
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    command:
      "node apps/storybook/node_modules/vite/bin/vite.js --config tests/integration/wp12/vite.config.ts --host 127.0.0.1 --port 6574 --strictPort",
    url: "http://127.0.0.1:6574",
    reuseExistingServer: false,
    env: { WP12_RUN: run, DO_NOT_TRACK: "1" },
  },
});
