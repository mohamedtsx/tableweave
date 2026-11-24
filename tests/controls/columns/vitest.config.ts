import { defineConfig } from "vitest/config";
import { sourceAliases } from "../harness/resolve.mjs";
export default defineConfig({
  cacheDir: "tests/controls/columns/.artifacts/vitest-portable",
  resolve: { alias: sourceAliases() },
  test: { include: ["tests/controls/columns/*.test.ts"], environment: "node" },
});
