import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  outputDir: ".artifacts/browser-results",
  use: { baseURL: "http://127.0.0.1:6564", browserName: "chromium" },
  webServer: {
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/reordering/fence-domains/vite.config.mjs --host 127.0.0.1 --port 6564 --strictPort",
    url: "http://127.0.0.1:6564/tests/reordering/fence-domains/browser.html",
    reuseExistingServer: false,
  },
});
