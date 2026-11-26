import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  // Deliberately excluded from the emitted/packed acceptance's *.spec.ts glob.
  testMatch: "*.storybook.ts",
  outputDir: "./.artifacts/storybook-play/results",
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("./.artifacts/storybook-play/results.json", import.meta.url),
        ),
      },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:6443",
    browserName: "chromium",
    locale: "en-US",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/filter-tools/browser/storybook.server.config.ts",
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    url: "http://127.0.0.1:6443/index.json",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
