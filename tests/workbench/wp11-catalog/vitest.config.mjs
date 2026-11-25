import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
const path = (value) =>
  fileURLToPath(new URL(`../../../${value}`, import.meta.url));
const entries = [
  ["@tableweave/react", "react"],
  ["@tableweave/heroui", "heroui"],
];
export default defineConfig({
  resolve: {
    alias: [
      ...entries.map(([name, packageName]) => ({
        find: new RegExp(`^${name}$`),
        replacement: path(`packages/${packageName}/src/index.ts`),
      })),
      ...["contracts", "filters", "reordering-controller", "reordering"].map(
        (entry) => ({
          find: `@tableweave/react/${entry}`,
          replacement: path(`packages/react/src/${entry}/index.ts`),
        }),
      ),
      { find: "react", replacement: path("apps/storybook/node_modules/react") },
      {
        find: "react-dom",
        replacement: path("apps/storybook/node_modules/react-dom"),
      },
      {
        find: /^@heroui\/react\/(.*)$/,
        replacement: path(
          "apps/storybook/node_modules/@heroui/react/dist/components/$1/index.js",
        ),
      },
    ],
  },
  cacheDir: "tests/workbench/wp11-catalog/.artifacts/ssr-cache",
  test: {
    include: ["tests/workbench/wp11-catalog/ssr.test.tsx"],
    environment: "node",
  },
});
