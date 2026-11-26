import { defineConfig } from "vitest/config";
import base from "../../../vitest.config.ts";
export default defineConfig({
  resolve: base.resolve,
  cacheDir: "tests/reordering/ui-bridge/.artifacts/unit-cache",
  test: {
    include: ["tests/reordering/ui-bridge/*.test.{ts,tsx}"],
    environment: "node",
  },
});
