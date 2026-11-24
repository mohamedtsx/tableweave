import { defineConfig } from "vitest/config";
import { aliases } from "./source-aliases.mjs";
export default defineConfig({
  resolve: { alias: aliases, dedupe: ["react", "react-dom"] },
  cacheDir: `${process.env.CRITERIA_SEARCH_TABS_ARTIFACT_DIR ?? "tests/criteria-search-tabs/.artifacts/units"}/vite-cache`,
  test: {
    include: [
      "tests/criteria-search-tabs/*.test.ts",
      "tests/criteria-search-tabs/*.test.tsx",
    ],
    environment: "node",
  },
});
