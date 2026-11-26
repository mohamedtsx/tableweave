import { defineConfig } from "@playwright/test";

const production = process.env.WP06_PRODUCTION === "1";
const port = Number(process.env.WP06_PORT ?? 6013);
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: `../../.artifacts/start/browser-${port}-${production ? "production" : "dev"}`,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: production
      ? `PORT=${port} node serve.mjs`
      : `PORT=${port} pnpm dev`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
