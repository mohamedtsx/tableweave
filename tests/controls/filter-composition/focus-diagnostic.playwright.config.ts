import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testMatch: "focus-diagnostic.spec.ts",
  outputDir: "./.artifacts/focus-unclocked",
});
