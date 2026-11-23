import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  testIgnore: "**/collection/**",
  outputDir: "/tmp/opencode/tableweave-native-browser-results",
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:6011" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite --config tests/native/vite.config.ts --host 127.0.0.1 --port 6011 --strictPort",
    url: "http://127.0.0.1:6011/native.html",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
