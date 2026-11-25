import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  use: { browserName: "chromium", baseURL: "http://127.0.0.1:6580" },
  outputDir: ".artifacts/browser-results",
  webServer: {
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/data-table/shell/vite.config.mjs",
    url: "http://127.0.0.1:6580/tests/data-table/shell/browser.html",
    reuseExistingServer: false,
  },
});
