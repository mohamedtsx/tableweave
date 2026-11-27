import { defineConfig } from "vitest/config";
import { sourceAliases } from "../harness/resolve.mjs";
export default defineConfig({
  cacheDir: "tests/controls/core/.artifacts/vitest-portable",
  resolve: { alias: sourceAliases() },
  test: { include: ["tests/controls/core/*.test.ts"], environment: "node" },
});
