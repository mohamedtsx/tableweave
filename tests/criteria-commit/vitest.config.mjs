import { defineConfig } from "vitest/config";
import { aliases } from "./source-aliases.mjs";
export default defineConfig({
  cacheDir: `${process.env.CRITERIA_COMMIT_ARTIFACT_DIR ?? "tests/criteria-commit/.artifacts/units"}/vite-cache`,
  resolve: { alias: aliases },
  test: {
    include: [
      "tests/criteria-commit/*.test.ts",
      "tests/criteria-commit/*.test.tsx",
    ],
    environment: "node",
  },
});
