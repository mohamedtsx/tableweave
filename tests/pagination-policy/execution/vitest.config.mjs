import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { own, root } from "./guard.mjs";

const vendor = createRequire(join(root, "packages/react/package.json"));
const run = process.env.EXECUTION_RUN ?? "units";
if (!/^[a-z][a-z0-9-]*$/.test(run)) throw new Error("Unsafe own run label");
const artifacts = join(own, ".artifacts", run);
mkdirSync(artifacts, { recursive: true });
const modules = new Set();
export default {
  root: own,
  cacheDir: join(artifacts, "vite-cache"),
  resolve: {
    alias: [
      { find: /^react$/, replacement: vendor.resolve("react") },
      { find: /^react-dom$/, replacement: vendor.resolve("react-dom") },
      {
        find: /^@internationalized\/date$/,
        replacement: vendor.resolve("@internationalized/date"),
      },
    ],
  },
  plugins: [
    {
      name: "actual-source-only-execution-descriptor",
      enforce: "pre",
      transform(_code, id) {
        if (/\/packages\/(?:react|heroui)\/dist\//.test(id))
          throw new Error(`Workspace emit is not source proof: ${id}`);
        if (id.startsWith(join(root, "packages/"))) {
          modules.add(id);
          writeFileSync(
            join(artifacts, "source-modules.json"),
            JSON.stringify([...modules].sort(), null, 2),
          );
        }
      },
    },
  ],
  test: {
    include: [
      join(own, "execution.test.ts"),
      join(root, "tests/pagination-policy/contracts/policy.test.ts"),
      join(root, "tests/contracts/**/*.test.ts"),
      join(root, "tests/controller/**/*.test.ts"),
    ],
    environment: "node",
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    watch: false,
    forbidOnly: true,
    retry: 0,
    reporters: ["default", "json"],
    outputFile: { json: join(artifacts, "vitest.json") },
    coverage: { enabled: false, reportsDirectory: join(artifacts, "coverage") },
  },
};
