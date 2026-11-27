import { defineConfig, devices } from "@playwright/test";
import { workspace } from "./public-roots.mjs";
export default defineConfig({
  testDir: ".",
  testMatch: "integration.spec.ts",
  workers: 1,
  outputDir: "./.artifacts/archive-browser",
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6483", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    cwd: workspace,
    command: "node tests/controls/integration/archive-dev.mjs",
    url: "http://127.0.0.1:6483",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
