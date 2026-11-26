import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  retries: 0,
  fullyParallel: false,
  outputDir: ".artifacts/final-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile:
          "tests/table-renderer-collection/.artifacts/final-browser.json",
      },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:6551",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --configLoader native --config tests/table-renderer-collection/vite.config.mjs",
    url: "http://127.0.0.1:6551/tests/table-renderer-collection/browser.html",
    reuseExistingServer: false,
  },
});
