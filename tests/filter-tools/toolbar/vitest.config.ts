import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const vendor = createRequire(
  new URL("../../../apps/storybook/package.json", import.meta.url),
);
export default defineConfig({
  resolve: {
    alias: {
      "@tableweave/react/filters": fileURLToPath(
        new URL(
          "../../../packages/react/src/filters/index.ts",
          import.meta.url,
        ),
      ),
      "@internationalized/date": vendor.resolve("@internationalized/date"),
    },
  },
  test: {
    include: ["tests/filter-tools/toolbar/*.test.ts"],
    environment: "node",
  },
});
