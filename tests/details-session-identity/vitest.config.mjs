import { defineConfig } from "vitest/config";
import base from "../../vitest.config.ts";

export default defineConfig({
  resolve: base.resolve,
  test: {
    include: ["tests/details-session-identity/lookup.test.ts"],
    environment: "node",
  },
});
