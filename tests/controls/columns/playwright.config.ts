import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  timeout: 30_000,
  testDir: ".",
  testMatch: "*.spec.ts",
  // Preserved regression/source preimages are evidence, not additional tests.
  testIgnore: "**/.artifacts/**",
  outputDir: "./.artifacts/test-results",
  reporter: [["list"], ["json", { outputFile: "./.artifacts/results.json" }]],
  use: { baseURL: "http://127.0.0.1:6467", trace: "retain-on-failure" },
  workers: 1,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite --config tests/controls/columns/vite.config.ts --host 127.0.0.1 --port 6467 --strictPort",
    url: "http://127.0.0.1:6467",
    reuseExistingServer: false,
  },
});
