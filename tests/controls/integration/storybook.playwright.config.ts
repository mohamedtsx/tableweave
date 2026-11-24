import { defineConfig, devices } from "@playwright/test";
import { workspace } from "./public-roots.mjs";
export default defineConfig({
  timeout: 30_000,
  testDir: ".",
  testMatch: "storybook.spec.ts",
  workers: 1,
  outputDir: "./.artifacts/storybook-browser",
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6483", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    cwd: workspace,
    command: "node tests/controls/integration/serve-storybook.mjs",
    url: "http://127.0.0.1:6483/index.json",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
