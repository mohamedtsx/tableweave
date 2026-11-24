import { createRequire } from "node:module";
import { dirname } from "node:path";
import { defineConfig } from "vitest/config";

const vendor = createRequire(
  new URL("./packages/react/package.json", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      react: dirname(vendor.resolve("react/package.json")),
      "react-dom": dirname(vendor.resolve("react-dom/package.json")),
    },
  },
  test: {
    maxWorkers: 4,
    include: [
      "tests/foundation/**/*.test.ts",
      "tests/contracts/**/*.test.ts",
      "tests/controller/**/*.test.ts",
      "tests/native/**/*.test.ts",
      "tests/resource/**/*.test.ts",
    ],
    environment: "node",
  },
});
