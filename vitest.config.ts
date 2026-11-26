import { createRequire } from "node:module";
import { dirname } from "node:path";
import { defineConfig } from "vitest/config";

const vendor = createRequire(
  new URL("./packages/react/package.json", import.meta.url),
);
const start = createRequire(
  new URL("./apps/example-start/package.json", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      "@tanstack/react-query": start.resolve("@tanstack/react-query"),
      react: dirname(vendor.resolve("react/package.json")),
      "react-dom": dirname(vendor.resolve("react-dom/package.json")),
      "@internationalized/date": vendor.resolve("@internationalized/date"),
    },
  },
  test: {
    // Keep graph/compiler fixtures bounded as the suite grows; no assertion or
    // behavior timeout is relaxed by limiting concurrent worker processes.
    maxWorkers: 4,
    include: [
      "tests/foundation/**/*.test.ts",
      "tests/contracts/**/*.test.ts",
      "tests/controller/**/*.test.ts",
      "tests/native/**/*.test.ts",
      "tests/resource/**/*.test.ts",
      "tests/filter-tools/unit/**/*.test.ts",
      "tests/filter-tools/toolbar/**/*.test.ts",
      "tests/start/authorization-supersession.test.ts",
    ],
    environment: "node",
  },
});
