import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import {
  checkedBuildDirectory,
  checkedRunDirectory,
  reserveRunDirectory,
  verifyBrowser,
} from "./paths.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url)).replace(
  /\/$/,
  "",
);
if (root !== "/tmp/opencode/tableweave-wp11-workbench") {
  throw new Error(
    "This selected harness is restricted to the primary worktree",
  );
}
const build = checkedBuildDirectory(process.env.TABLEWEAVE_STORYBOOK_BUILD_DIR);
const run = checkedRunDirectory(process.env.TABLEWEAVE_STORYBOOK_RUN);
const executablePath = verifyBrowser();
if (
  process.env.PLAYWRIGHT_TRANSFORM_CACHE_DIR !==
  join(`${run}-cache`, "playwright")
) {
  throw new Error(
    "Set the fresh run's PLAYWRIGHT_TRANSFORM_CACHE_DIR before CLI startup",
  );
}
reserveRunDirectory(run);
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
const server = fileURLToPath(new URL("./serve-static.mjs", import.meta.url));

export default defineConfig({
  testDir: fileURLToPath(new URL("./", import.meta.url)),
  testMatch: "ready.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  globalTimeout: 600_000,
  expect: { timeout: 10_000 },
  outputDir: join(run, "results"),
  reporter: [
    ["list"],
    ["json", { outputFile: join(run, "report", "results.json") }],
    ["html", { outputFolder: join(run, "report", "html"), open: "never" }],
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
    command: `${quote(process.execPath)} ${quote(server)} --dir ${quote(build)} --port 6570`,
    cwd: root,
    url: "http://127.0.0.1:6570/index.json",
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      STORYBOOK_DISABLE_TELEMETRY: "1",
      DO_NOT_TRACK: "1",
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
      CACHE_DIR: `${run}-cache`,
    },
  },
});
