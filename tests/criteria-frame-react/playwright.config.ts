import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "react.spec.ts",
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
          "tests/criteria-frame-react/.artifacts/final-browser/results.json",
      },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:4299",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --config tests/criteria-frame-react/vite.config.mjs",
    url: "http://127.0.0.1:4299/tests/criteria-frame-react/react.html",
    reuseExistingServer: false,
  },
});
