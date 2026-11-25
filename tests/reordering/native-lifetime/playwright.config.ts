import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  outputDir: ".artifacts/playwright-results",
  use: { baseURL: "http://127.0.0.1:6590", headless: true },
  webServer: {
    command:
      "pnpm exec vite --config tests/reordering/native-lifetime/vite.config.mjs",
    url: "http://127.0.0.1:6590/tests/reordering/native-lifetime/browser.html",
    reuseExistingServer: false,
  },
});
