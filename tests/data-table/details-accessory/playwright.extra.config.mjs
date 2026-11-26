import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";
export default defineConfig({
  ...base,
  testMatch: "extra.spec.mjs",
  outputDir: ".artifacts/extra-browser-results",
});
