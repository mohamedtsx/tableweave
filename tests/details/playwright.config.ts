import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "./.artifacts/browser",
  reporter: "list",
  workers: 1,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:6447", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite --config tests/details/vite.config.ts --configLoader runner --host 127.0.0.1 --port 6447 --strictPort",
    url: "http://127.0.0.1:6447/proof.html",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
