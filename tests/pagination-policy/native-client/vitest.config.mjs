import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { own, root } from "./guard.mjs";

const vendor = createRequire(join(root, "packages/react/package.json"));
const run = process.env.U2_RUN ?? "units";
if (!/^[a-z][a-z0-9-]*$/.test(run)) throw new Error("Unsafe run label");
const output = join(own, ".artifacts", run);
mkdirSync(output, { recursive: true });
export default {
  root,
  cacheDir: join(output, "vite-cache"),
  resolve: {
    alias: [
      ...[
        ["@tableweave/react", "react/src/index.ts"],
        ["@tableweave/react/contracts", "react/src/contracts/index.ts"],
        ["@tableweave/react/filters", "react/src/filters/index.ts"],
      ].map(([name, path]) => ({
        find: new RegExp(`^${name.replaceAll("/", "\\/")}$`),
        replacement: join(root, "packages", path),
      })),
      {
        find: /^react$/,
        replacement: dirname(vendor.resolve("react/package.json")),
      },
      {
        find: /^react-dom$/,
        replacement: dirname(vendor.resolve("react-dom/package.json")),
      },
      {
        find: /^@internationalized\/date$/,
        replacement: vendor.resolve("@internationalized/date"),
      },
    ],
  },
  plugins: [
    {
      name: "u2-actual-target-source",
      enforce: "pre",
      transform(_code, id) {
        if (/\/packages\/(?:react|heroui)\/dist\//.test(id))
          throw new Error(`Unexpected workspace dist ${id}`);
      },
    },
  ],
  test: {
    include:
      run === "before-paged"
        ? [join(own, "baseline.test.ts")]
        : run === "before-disabled"
          ? [join(own, "disabled.test.ts")]
          : [
              join(own, "*.test.ts"),
              "tests/native/*.test.ts",
              "tests/controller/**/*.test.ts",
              "tests/contracts/**/*.test.ts",
              "tests/controls/core/commands.test.ts",
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
