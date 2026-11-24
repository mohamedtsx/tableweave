import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { hash, initial, own, root } from "./scope.mjs";

const vendor = createRequire(join(root, "packages/react/package.json"));
const run = process.env.U4_RUN ?? "units";
if (!/^[a-z][a-z0-9-]*$/.test(run)) throw new Error("Unsafe run label");
const preimage = process.env.U4_PREIMAGE === "1",
  output = join(own, ".artifacts", run);
mkdirSync(output, { recursive: true });
export default {
  root,
  cacheDir: join(output, "vite-cache"),
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
      name: "u4-exact-source-and-immutable-preimage",
      enforce: "pre",
      load(id) {
        if (/\/packages\/(react|heroui)\/dist\//.test(id))
          throw new Error(`Workspace dist rejected: ${id}`);
        if (!preimage) return;
        const path = id.startsWith(`${root}/`) ? id.slice(root.length + 1) : "";
        if (Object.hasOwn(initial, path)) {
          const bytes = readFileSync(
            join(own, ".artifacts", `original-${path.replaceAll("/", "_")}`),
          );
          if (hash(bytes) !== initial[path])
            throw new Error(`Altered preimage: ${path}`);
          return bytes.toString("utf8");
        }
      },
    },
  ],
  test: {
    include:
      preimage || run.startsWith("legacy-")
        ? [join(own, "legacy.test.ts")]
        : [
            join(own, "*.test.ts"),
            "tests/native/*.test.ts",
            "tests/controls/core/*.test.ts",
            "tests/resource/*.test.ts",
            "tests/contracts/*.test.ts",
            "tests/controller/*.test.ts",
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
