import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import {
  assertDirectoryChain,
  reserveRunDirectory,
  verifyBrowser,
} from "../../workbench/wp11-storybook-ready/paths.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url)).replace(
  /\/$/,
  "",
);
const own =
  "/mnt/data/Projects/tableweave-final-verification-cand001/wp13-run-cand001/storybook-ready";
const label = process.env.TABLEWEAVE_SOURCE_BROWSER_RUN;
if (
  root !== "/tmp/opencode/tableweave-wp11-workbench" ||
  label === undefined ||
  !/^[0-9]{3}$/.test(label)
)
  throw new Error("Explicit primary source-browser selection required");
const run = join(own, `source-browser-${label}`);
const cache = `${run}-cache`;
if (process.env.PLAYWRIGHT_TRANSFORM_CACHE_DIR !== join(cache, "playwright"))
  throw new Error(
    "Select the source-browser transform cache before CLI startup",
  );
assertDirectoryChain(own);
reserveRunDirectory(run);
const executablePath = verifyBrowser();
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
export default defineConfig({
  testDir: join(root, "tests/reordering"),
  testMatch: [
    "**/query-safe/query-safe.spec.ts",
    "**/grouped-data-table/browser.spec.ts",
  ],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  globalTimeout: 600_000,
  expect: { timeout: 10_000 },
  outputDir: join(run, "results"),
  reporter: [
    ["list"],
    ["json", { outputFile: join(run, "report/results.json") }],
  ],
  use: {
    baseURL: "http://127.0.0.1:6570",
    browserName: "chromium",
    headless: true,
    launchOptions: { executablePath },
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `${quote(process.execPath)} node_modules/vite/bin/vite.js --config tests/reordering/query-safe/vite.config.mjs --configLoader native --host 127.0.0.1 --port 6570 --strictPort`,
    cwd: root,
    url: "http://127.0.0.1:6570/tests/reordering/query-safe/browser.html",
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      TABLEWEAVE_SOURCE_BROWSER_RUN: label,
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
      DO_NOT_TRACK: "1",
      CACHE_DIR: cache,
    },
  },
});
