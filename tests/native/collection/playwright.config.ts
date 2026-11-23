import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "./.artifacts/test-results",
  reporter: [["list"], ["json", { outputFile: "./.artifacts/results.json" }]],
  use: { baseURL: "http://127.0.0.1:6009", trace: "retain-on-failure" },
  workers: 1,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command:
      "pnpm exec vite --config tests/native/collection/vite.config.ts --host 127.0.0.1 --port 6009 --strictPort",
    url: "http://127.0.0.1:6009",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
