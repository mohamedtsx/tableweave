import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const vendor = createRequire(
  new URL("../../packages/react/package.json", import.meta.url),
);
export default defineConfig({
  cacheDir: fileURLToPath(
    new URL("../../.artifacts/resource-vitest", import.meta.url),
  ),
  resolve: {
    alias: {
      react: dirname(vendor.resolve("react/package.json")),
      "react-dom": dirname(vendor.resolve("react-dom/package.json")),
    },
  },
  test: { include: ["tests/resource/**/*.test.ts"], environment: "node" },
});
