import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:6569", browserName: "chromium" },
  outputDir: ".artifacts/browser-results",
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/details-session-identity/vite.config.mjs",
    url: "http://127.0.0.1:6569/tests/details-session-identity/browser.html",
    reuseExistingServer: false,
  },
});
