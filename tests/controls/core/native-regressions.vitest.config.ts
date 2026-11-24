import { defineConfig } from "vitest/config";
import { sourceAliases } from "../harness/resolve.mjs";
export default defineConfig({
  cacheDir: "tests/controls/core/.artifacts/native-vitest-portable",
  resolve: { alias: sourceAliases() },
  test: { include: ["tests/native/*.test.ts"], environment: "node" },
});
