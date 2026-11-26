import { defineConfig, devices } from "@playwright/test";
import { workspace } from "./roots.mjs";
export default defineConfig({
  testDir: ".",
  testMatch: "composition.spec.ts",
  workers: 1,
  timeout: 30_000,
  outputDir: "./.artifacts/browser",
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6499", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    cwd: workspace,
    command:
      "pnpm exec vite --config tests/controls/filter-composition/vite.config.ts --host 127.0.0.1 --port 6499 --strictPort",
    url: "http://127.0.0.1:6499",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
