import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "hooks.spec.ts",
  outputDir: "../../.artifacts/resource-playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:6415", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite --config tests/resource/vite.config.ts --configLoader runner --host 127.0.0.1 --port 6415 --strictPort",
    url: "http://127.0.0.1:6415/hooks.html",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
