import { defineConfig, devices } from "@playwright/test";
import { generationDirectory, workspace } from "./roots.mjs";
export default defineConfig({
  testDir: ".",
  testMatch: "probes.spec.ts",
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  outputDir: `${generationDirectory()}/browser`,
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6505", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    cwd: workspace,
    command:
      "pnpm exec vite --config tests/controls/focus-handoff/vite.config.ts --host 127.0.0.1 --port 6505 --strictPort",
    url: "http://127.0.0.1:6505/probe.html",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
