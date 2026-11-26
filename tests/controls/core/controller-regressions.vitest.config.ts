import { defineConfig } from "vitest/config";
import { sourceAliases } from "../harness/resolve.mjs";
export default defineConfig({
  cacheDir: "tests/controls/core/.artifacts/controller-vitest-portable",
  resolve: { alias: sourceAliases() },
  test: { include: ["tests/controller/*.test.ts"], environment: "node" },
});
