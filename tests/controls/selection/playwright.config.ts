import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  timeout: 30_000,
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "./.artifacts/test-results",
  reporter: [["list"], ["json", { outputFile: "./.artifacts/results.json" }]],
  use: { baseURL: "http://127.0.0.1:6463", trace: "retain-on-failure" },
  workers: 1,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite --config tests/controls/selection/vite.config.ts --host 127.0.0.1 --port 6463 --strictPort",
    url: "http://127.0.0.1:6463",
    reuseExistingServer: false,
  },
});
