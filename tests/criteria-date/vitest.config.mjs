import { defineConfig } from "vitest/config";
import { aliases } from "./source-aliases.mjs";
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
  cacheDir: `${process.env.CRITERIA_DATE_ARTIFACT_DIR ?? "tests/criteria-date/.artifacts/units"}/vite-cache`,
  test: {
    include: [
      "tests/criteria-date/*.test.ts",
      "tests/criteria-date/*.test.tsx",
    ],
    environment: "node",
  },
});
