import { defineConfig } from "vitest/config";
import base from "../../../vitest.config.ts";

export default defineConfig({
  resolve: base.resolve,
  cacheDir: "tests/reordering/unpaged-extent/.artifacts/unit-cache",
  test: {
    include: ["tests/reordering/unpaged-extent/*.test.ts"],
    environment: "node",
  },
});
