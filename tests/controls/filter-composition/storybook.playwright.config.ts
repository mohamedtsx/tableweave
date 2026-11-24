import { defineConfig, devices } from "@playwright/test";
import { workspace } from "./roots.mjs";
export default defineConfig({
  testDir: ".",
  testMatch: "storybook.spec.ts",
  workers: 1,
  timeout: 30_000,
  outputDir: "./.artifacts/storybook",
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6499", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    cwd: workspace,
    command: "node tests/controls/filter-composition/serve-storybook.mjs",
    url: "http://127.0.0.1:6499/index.json",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
