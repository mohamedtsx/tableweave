import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { own, root } from "./guard.mjs";

const vendor = createRequire(join(root, "packages/react/package.json"));
const run = process.env.U3_RUN ?? "units";
if (!/^[a-z][a-z0-9-]*$/.test(run)) throw new Error("Unsafe run label");
const out = join(own, ".artifacts", run);
mkdirSync(out, { recursive: true });
export default {
  root,
  cacheDir: join(out, "vite-cache"),
  resolve: {
    alias: [
      ...["resource", "contracts"].map((entry) => ({
        find: new RegExp(
          `^\\.\\./\\.\\./packages/react/dist/${entry}/index\\.js$`,
        ),
        replacement: join(root, `packages/react/src/${entry}/index.ts`),
      })),
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
      name: "u3-actual-source-no-workspace-dist",
      enforce: "pre",
      transform(_code, id) {
        if (/\/packages\/(react|heroui)\/dist\//.test(id))
          throw new Error(`Unexpected workspace dist ${id}`);
      },
    },
  ],
  test: {
    include:
      run === "before-legacy"
        ? [join(own, "baseline.test.ts")]
        : run === "before-extent"
          ? [join(own, "before-policy.test.ts")]
          : [
              join(own, "*.test.ts"),
              "tests/resource/*.test.ts",
              "tests/contracts/**/*.test.ts",
              "tests/controller/**/*.test.ts",
            ],
    environment: "node",
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    watch: false,
    forbidOnly: true,
    retry: 0,
    reporters: ["default", "json"],
    outputFile: { json: join(out, "vitest.json") },
    coverage: { enabled: false, reportsDirectory: join(out, "coverage") },
  },
};
