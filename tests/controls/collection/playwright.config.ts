import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  timeout: 30_000,
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  outputDir: "./.artifacts/results",
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6469", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite --config tests/controls/collection/vite.config.ts --host 127.0.0.1 --port 6469 --strictPort",
    url: "http://127.0.0.1:6469",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
