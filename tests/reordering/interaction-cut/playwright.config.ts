import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  outputDir: ".artifacts/browser-results",
  use: { baseURL: "http://127.0.0.1:6565", browserName: "chromium" },
  webServer: {
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/reordering/interaction-cut/vite.config.mjs --host 127.0.0.1 --port 6565 --strictPort",
    url: "http://127.0.0.1:6565/tests/reordering/interaction-cut/browser.html",
    reuseExistingServer: false,
  },
});
