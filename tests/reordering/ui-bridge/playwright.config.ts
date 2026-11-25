import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  outputDir: ".artifacts/browser-results",
  use: { baseURL: "http://127.0.0.1:6563", browserName: "chromium" },
  webServer: {
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/reordering/ui-bridge/vite.config.mjs --host 127.0.0.1 --port 6563 --strictPort",
    url: "http://127.0.0.1:6563/tests/reordering/ui-bridge/browser.html",
    reuseExistingServer: false,
  },
});
