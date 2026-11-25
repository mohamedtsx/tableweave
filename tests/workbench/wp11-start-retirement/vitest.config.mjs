// FINAL UNRUN: preserve/select ALL original parent contract assertions plus new cases.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
const path = (name) =>
  fileURLToPath(new URL(`../../../${name}`, import.meta.url));
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@tableweave\/react$/,
        replacement: path("packages/react/dist/index.js"),
      },
      ...["contracts", "filters", "reordering", "reordering-controller"].map(
        (entry) => ({
          find: `@tableweave/react/${entry}`,
          replacement: path(`packages/react/dist/${entry}/index.js`),
        }),
      ),
      {
        find: /^@tanstack\/react-query$/,
        replacement: path(
          "apps/example-start-facade/node_modules/@tanstack/react-query",
        ),
      },
    ],
  },
  cacheDir: "tests/workbench/wp11-start-retirement/.artifacts/vitest-cache",
  test: {
    environment: "node",
    include: [
      "tests/workbench/wp11-start-facade/final/contracts.test.ts",
      "tests/workbench/wp11-start-retirement/final/retirement.test.ts",
    ],
  },
});
