import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: ".artifacts/browser-results",
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6429", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite --config tests/filter-tools/toolbar/vite.config.ts --host 127.0.0.1 --port 6429 --strictPort",
    url: "http://127.0.0.1:6429/toolbar.html",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
