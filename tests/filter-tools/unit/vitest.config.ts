import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: "/tmp/opencode/tableweave-wp07-headless-vitest",
  test: {
    include: ["tests/filter-tools/unit/**/*.test.ts"],
    environment: "node",
  },
});
