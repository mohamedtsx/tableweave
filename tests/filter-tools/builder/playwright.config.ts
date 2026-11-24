import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  outputDir: "./.artifacts/results",
  reporter: [["list"], ["json", { outputFile: "./.artifacts/results.json" }]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: { baseURL: "http://127.0.0.1:6433", trace: "retain-on-failure" },
  webServer: {
    command:
      "pnpm exec vite --config tests/filter-tools/builder/vite.config.ts --host 127.0.0.1 --port 6433 --strictPort",
    url: "http://127.0.0.1:6433",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
