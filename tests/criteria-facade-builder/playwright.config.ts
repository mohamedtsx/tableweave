import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:6555", browserName: "chromium" },
  outputDir: ".artifacts/browser-results",
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/criteria-facade-builder/vite.config.mjs --host 127.0.0.1 --port 6555 --strictPort",
    url: "http://127.0.0.1:6555/tests/criteria-facade-builder/browser.html",
    reuseExistingServer: false,
  },
});
