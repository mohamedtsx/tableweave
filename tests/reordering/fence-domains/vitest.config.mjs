import { defineConfig } from "vitest/config";
import base from "../../../vitest.config.ts";
export default defineConfig({
  resolve: base.resolve,
  cacheDir: "tests/reordering/fence-domains/.artifacts/unit-cache",
  test: {
    include: ["tests/reordering/fence-domains/*.test.{ts,tsx}"],
    environment: "node",
  },
});
