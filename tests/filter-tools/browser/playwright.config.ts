import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "./.artifacts/results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("./.artifacts/results.json", import.meta.url),
        ),
      },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:6443",
    locale: "en-US",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: {
    command:
      "pnpm exec vite --config tests/filter-tools/browser/vite.config.ts --configLoader runner --host 127.0.0.1 --port 6443 --strictPort",
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    url: "http://127.0.0.1:6443/",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
