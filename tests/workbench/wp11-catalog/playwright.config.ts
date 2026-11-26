import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  workers: 1,
  outputDir: ".artifacts/browser-results",
  use: { baseURL: "http://127.0.0.1:6570", browserName: "chromium" },
  webServer: {
    cwd: fileURLToPath(new URL("../../../apps/storybook/", import.meta.url)),
    command:
      "node node_modules/storybook/bin/index.cjs dev --port 6570 --exact-port --host 127.0.0.1 --no-open --no-version-updates --disable-telemetry",
    url: "http://127.0.0.1:6570",
    reuseExistingServer: false,
    env: { STORYBOOK_DISABLE_TELEMETRY: "1", DO_NOT_TRACK: "1" },
  },
});
