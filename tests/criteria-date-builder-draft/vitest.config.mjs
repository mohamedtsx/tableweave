import { defineConfig } from "vitest/config";
import { aliases } from "../criteria-date/source-aliases.mjs";

export default defineConfig({
  resolve: {
    alias: aliases,
    dedupe: [
      "react",
      "react-dom",
      "react-aria-components",
      "@internationalized/date",
    ],
  },
  cacheDir: `${process.env.CRITERIA_DATE_BUILDER_DRAFT_ARTIFACT_DIR ?? "tests/criteria-date-builder-draft/.artifacts/units"}/vite-cache`,
  test: {
    include: ["tests/criteria-date-builder-draft/*.test.ts"],
    environment: "node",
  },
});
