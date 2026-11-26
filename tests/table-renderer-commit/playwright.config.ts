import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  outputDir: ".artifacts/final-browser/results",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile:
          "tests/table-renderer-commit/.artifacts/final-browser/results.json",
      },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:6550",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --configLoader native --config tests/table-renderer-commit/vite.config.mjs",
    url: "http://127.0.0.1:6550/tests/table-renderer-commit/browser.html",
    reuseExistingServer: false,
  },
});
