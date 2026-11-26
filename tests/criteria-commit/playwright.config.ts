import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:4193", browserName: "chromium" },
  outputDir: ".artifacts/browser-results",
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/criteria-commit/vite.config.mjs --host 127.0.0.1 --port 4193 --strictPort",
    url: "http://127.0.0.1:4193/tests/criteria-commit/browser.html",
    reuseExistingServer: false,
  },
});
