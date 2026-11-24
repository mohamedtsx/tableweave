import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const run = process.env.NATIVE_BROWSER_RUN;
if (!run || !/^[a-z][a-z0-9-]*$/.test(run))
  throw new Error("Set a new NATIVE_BROWSER_RUN generation");
const artifact = (path: string) =>
  fileURLToPath(new URL(`./.artifacts/${run}/${path}`, import.meta.url));
if (process.env.TEST_WORKER_INDEX === undefined && existsSync(artifact("")))
  throw new Error("Browser generation exists; use a new NATIVE_BROWSER_RUN");
// Playwright's JSON environment overrides reporter options. Constrain both.
process.env.PLAYWRIGHT_JSON_OUTPUT_FILE = artifact("results.json");
process.env.PLAYWRIGHT_JSON_OUTPUT_DIR = artifact("");
process.env.PLAYWRIGHT_JSON_OUTPUT_NAME = "results.json";
export default defineConfig({
  testDir: ".",
  testMatch: "native.spec.ts",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  workers: 1,
  outputDir: artifact("test-results"),
  reporter: [["list"], ["json", { outputFile: artifact("results.json") }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:6541",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium" }],
  webServer: {
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/pagination-policy/native-browser/vite.config.mjs --configLoader native",
    url: "http://127.0.0.1:6541",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
