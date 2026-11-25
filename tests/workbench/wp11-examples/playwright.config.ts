import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  outputDir: ".artifacts/browser-results",
  use: { baseURL: "http://127.0.0.1:6572", browserName: "chromium" },
  webServer: {
    cwd: fileURLToPath(new URL("../../../apps/storybook/", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config vite.examples.config.ts --host 127.0.0.1 --port 6572 --strictPort",
    url: "http://127.0.0.1:6572",
    reuseExistingServer: false,
  },
});
