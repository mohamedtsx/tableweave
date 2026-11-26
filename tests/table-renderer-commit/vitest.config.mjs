import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { aliases } from "../criteria-commit/source-aliases.mjs";
import { own, root } from "./scope.mjs";

const vendor = createRequire(join(root, "packages/react/package.json"));
export default {
  root,
  cacheDir: join(own, ".artifacts/final-units/cache"),
  resolve: {
    alias: [
      ...aliases,
      ...[
        "react-dom/client",
        "react-dom/server",
        "@internationalized/date",
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
      name: "renderer-actual-source-only",
      enforce: "pre",
      load(id) {
        if (/\/packages\/(react|heroui)\/dist\//.test(id))
          throw new Error(`Historical dist is not this candidate: ${id}`);
      },
    },
  ],
  test: {
    include: [
      "tests/table-renderer-commit/*.test.{ts,tsx}",
      "tests/criteria-commit/{cell,work,ssr}.test.{ts,tsx}",
    ],
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
