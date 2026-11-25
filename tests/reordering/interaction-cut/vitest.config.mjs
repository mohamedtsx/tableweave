import { defineConfig } from "vitest/config";
import base from "../../../vitest.config.ts";
export default defineConfig({
  resolve: base.resolve,
  cacheDir: "tests/reordering/interaction-cut/.artifacts/unit-cache",
  test: {
    include: ["tests/reordering/interaction-cut/*.test.{ts,tsx}"],
    environment: "node",
  },
});
