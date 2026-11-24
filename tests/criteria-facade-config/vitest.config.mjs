import { defineConfig } from "vitest/config";
import base from "../../vitest.config.ts";
export default defineConfig({
  resolve: base.resolve,
  test: {
    include: ["tests/criteria-facade-config/*.test.{ts,tsx}"],
    environment: "node",
  },
});
