import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/foundation/**/*.test.ts",
      "tests/contracts/**/*.test.ts",
      "tests/controller/**/*.test.ts",
    ],
    environment: "node",
  },
});
