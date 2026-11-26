import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { own, root } from "./scope.mjs";

const run = process.env.F1_RUN ?? "units";
if (!/^[a-z][a-z0-9-]*$/.test(run)) throw new Error("Unsafe run label");
const output = join(own, ".artifacts", run);
mkdirSync(output, { recursive: true });
const vendor = createRequire(join(root, "packages/react/package.json"));
export default {
  root,
  cacheDir: join(output, "vite-cache"),
  resolve: {
    alias: [
      ...["contracts", "resource"].map((entry) => ({
        find: new RegExp(
          `^\\.\\./\\.\\./packages/react/dist/${entry}/index\\.js$`,
        ),
        replacement: join(root, `packages/react/src/${entry}/index.ts`),
      })),
      ...[
        ["@tableweave/react", "index.ts"],
        ["@tableweave/react/contracts", "contracts/index.ts"],
        ["@tableweave/react/filters", "filters/index.ts"],
      ].map(([name, path]) => ({
        find: new RegExp(`^${name.replaceAll("/", "\\/")}$`),
        replacement: join(root, "packages/react/src", path),
      })),
      {
        find: /^@tanstack\/react-table$/,
        replacement: vendor.resolve("@tanstack/react-table"),
      },
      {
        find: /^react$/,
        replacement: dirname(vendor.resolve("react/package.json")),
      },
      {
        find: /^react-dom$/,
        replacement: dirname(vendor.resolve("react-dom/package.json")),
      },
      {
        find: /^react-dom\/server$/,
        replacement: vendor.resolve("react-dom/server"),
      },
      {
        find: /^@internationalized\/date$/,
        replacement: vendor.resolve("@internationalized/date"),
      },
    ],
  },
  plugins: [
    {
      name: "f1-current-target-source-only",
      enforce: "pre",
      load(id) {
        if (/\/packages\/(react|heroui)\/dist\//.test(id))
          throw new Error(`Workspace dist is not candidate source: ${id}`);
      },
    },
  ],
  test: {
    include: [
      "tests/criteria-frame/*.test.ts",
      "tests/native/*.test.ts",
      "tests/controls/core/*.test.ts",
      "tests/resource/*.test.ts",
    ],
    environment: "node",
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    watch: false,
    forbidOnly: true,
    retry: 0,
    reporters: ["default", "json"],
    outputFile: { json: join(output, "vitest.json") },
    coverage: { enabled: false, reportsDirectory: join(output, "coverage") },
  },
};
