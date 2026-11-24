import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/localization-state/locales.test.ts"],
    environment: "node",
  },
});
