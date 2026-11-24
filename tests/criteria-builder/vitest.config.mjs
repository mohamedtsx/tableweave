import { defineConfig } from "vitest/config";
import { aliases } from "./source-aliases.mjs";
export default defineConfig({
  resolve: { alias: aliases, dedupe: ["react", "react-dom", "react-aria-components", "@internationalized/date"] },
  cacheDir: `${process.env.CRITERIA_BUILDER_ARTIFACT_DIR ?? "tests/criteria-builder/.artifacts/units"}/vite-cache`,
  test: { include: ["tests/criteria-builder/*.test.ts", "tests/criteria-builder/*.test.tsx"], environment: "node" },
});
