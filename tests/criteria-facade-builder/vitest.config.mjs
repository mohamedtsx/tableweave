import { defineConfig } from "vitest/config";
import base from "../../vitest.config.ts";

export default defineConfig({
  resolve: base.resolve,
  cacheDir: "tests/criteria-facade-builder/.artifacts/unit-cache",
  test: {
    include: ["tests/criteria-facade-builder/*.test.{ts,tsx}"],
    environment: "node",
  },
});
