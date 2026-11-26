import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  timeout: 30_000,
  workers: 1,
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: ".artifacts/results",
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6465" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite --config tests/controls/pagination/vite.config.ts --host 127.0.0.1 --port 6465 --strictPort",
    url: "http://127.0.0.1:6465/",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
