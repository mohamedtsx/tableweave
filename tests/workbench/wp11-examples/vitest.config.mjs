import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
const path = (name) =>
  fileURLToPath(new URL(`../../../${name}`, import.meta.url));
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@tanstack\/react-query$/,
        replacement: path(
          "apps/example-start/node_modules/@tanstack/react-query",
        ),
      },
      {
        find: /^@tableweave\/react$/,
        replacement: path("packages/react/dist/index.js"),
      },
      ...["contracts", "filters", "reordering-controller", "reordering"].map(
        (entry) => ({
          find: `@tableweave/react/${entry}`,
          replacement: path(`packages/react/dist/${entry}/index.js`),
        }),
      ),
      { find: "react", replacement: path("apps/storybook/node_modules/react") },
      {
        find: "react-dom",
        replacement: path("apps/storybook/node_modules/react-dom"),
      },
    ],
  },
  cacheDir: "tests/workbench/wp11-examples/.artifacts/ssr-cache",
  test: {
    include: ["tests/workbench/wp11-examples/ssr.test.tsx"],
    environment: "node",
  },
});
