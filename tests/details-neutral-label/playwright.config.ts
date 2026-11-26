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
        outputFile: "tests/details-neutral-label/.artifacts/final-browser.json",
      },
    ],
  ],
  use: { baseURL: "http://127.0.0.1:6578", headless: true },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --configLoader native --config tests/details-neutral-label/vite.config.mjs",
    url: "http://127.0.0.1:6578/tests/details-neutral-label/browser.html",
    reuseExistingServer: false,
  },
});
