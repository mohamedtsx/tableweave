import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const vendor = createRequire(
  new URL("./packages/react/package.json", import.meta.url),
);
const start = createRequire(
  new URL("./apps/example-start/package.json", import.meta.url),
);
const sourceEntries = [
  ["@tableweave/react", "react/src/index.ts"],
  ["@tableweave/react/contracts", "react/src/contracts/index.ts"],
  ["@tableweave/react/filters", "react/src/filters/index.ts"],
  ["@tableweave/heroui", "heroui/src/index.ts"],
] as const;

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@tanstack\/react-query$/,
        replacement: start.resolve("@tanstack/react-query"),
      },
      // Source units must share one factory registry with their source fixtures.
      // Explicit dist imports below and real packed consumers remain unaliased.
      ...sourceEntries.map(([name, path]) => ({
        find: new RegExp(`^${name.replaceAll("/", "\\/")}$`),
        replacement: fileURLToPath(
          new URL(`./packages/${path}`, import.meta.url),
        ),
      })),
      {
        find: "react",
        replacement: dirname(vendor.resolve("react/package.json")),
      },
      {
        find: "react-dom",
        replacement: dirname(vendor.resolve("react-dom/package.json")),
      },
      {
        find: "@internationalized/date",
        replacement: vendor.resolve("@internationalized/date"),
      },
    ],
  },
  test: {
    // Keep independent graph/compiler checks within their unchanged deadlines.
    maxWorkers: 4,
    include: [
      "tests/foundation/**/*.test.ts",
      "tests/contracts/**/*.test.ts",
      "tests/controller/**/*.test.ts",
      "tests/native/**/*.test.ts",
      "tests/resource/**/*.test.ts",
      "tests/filter-tools/unit/**/*.test.ts",
      "tests/filter-tools/toolbar/**/*.test.ts",
      "tests/controls/core/**/*.test.ts",
      "tests/controls/selection/**/*.test.ts",
      "tests/controls/columns/**/*.test.ts",
      "tests/controls/pagination/**/*.test.ts",
      "tests/controls/pagination/**/*.test.tsx",
      "tests/start/authorization-supersession.test.ts",
    ],
    environment: "node",
  },
});
