import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: fileURLToPath(new URL("./.artifacts/vitest", import.meta.url)),
  test: {
    include: ["tests/criteria-authority/*.test.ts"],
    environment: "node",
  },
});
