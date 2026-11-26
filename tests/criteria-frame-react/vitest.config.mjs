import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { own, root } from "./scope.mjs";

const vendor = createRequire(join(root, "packages/react/package.json"));
export default {
  root,
  cacheDir: join(own, ".artifacts/final-units/vite-cache"),
  resolve: {
    alias: [
      ...[
        ["@tableweave/react", "index.ts"],
        ["@tableweave/react/contracts", "contracts/index.ts"],
        ["@tableweave/react/filters", "filters/index.ts"],
      ].map(([name, path]) => ({
        find: new RegExp(`^${name.replaceAll("/", "\\/")}$`),
        replacement: join(root, "packages/react/src", path),
      })),
      ...[
        "@tanstack/react-table",
        "@internationalized/date",
        "react-dom/client",
        "react-dom/server",
      ].map((name) => ({
        find: new RegExp(`^${name.replaceAll("/", "\\/")}$`),
        replacement: vendor.resolve(name),
      })),
      ...["react", "react-dom"].map((name) => ({
        find: new RegExp(`^${name}$`),
        replacement: dirname(vendor.resolve(`${name}/package.json`)),
      })),
    ],
  },
  plugins: [
    {
      name: "criteria-react-current-source-only",
      enforce: "pre",
      load(id) {
        if (/\/packages\/(react|heroui)\/dist\//.test(id))
          throw new Error(
            `Historical workspace dist is not candidate source: ${id}`,
          );
      },
    },
  ],
  test: {
    include: ["tests/criteria-frame-react/*.test.ts"],
    environment: "node",
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    watch: false,
    forbidOnly: true,
    retry: 0,
    reporters: ["default", "json"],
    outputFile: { json: join(own, ".artifacts/final-units/vitest.json") },
    coverage: { enabled: false },
  },
};
