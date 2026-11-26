import { defineConfig } from "vitest/config";
import { sourceAliases } from "../harness/resolve.mjs";
export default defineConfig({
  cacheDir: "tests/controls/selection/.artifacts/vitest",
  resolve: { alias: sourceAliases() },
  test: {
    include: ["tests/controls/selection/*.test.ts"],
    environment: "node",
  },
});
