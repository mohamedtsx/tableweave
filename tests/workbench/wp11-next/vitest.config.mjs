import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { defineConfig } from "vitest/config";
const source = (file) =>
  fileURLToPath(new URL(`../../../packages/${file}`, import.meta.url));
const vendor = createRequire(
  new URL("../../../apps/example-next/package.json", import.meta.url),
);
// Explicit SOURCE unit/React-SSR lane only. Never used by the Next runtime or
// the ordinary packed consumer; none of these tests is executed during LIGHT.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "react",
        replacement: dirname(vendor.resolve("react/package.json")),
      },
      {
        find: "react-dom",
        replacement: dirname(vendor.resolve("react-dom/package.json")),
      },
      {
        find: /^@tableweave\/react\/contracts$/,
        replacement: source("react/src/contracts/index.ts"),
      },
      {
        find: /^@tableweave\/react\/filters$/,
        replacement: source("react/src/filters/index.ts"),
      },
      {
        find: /^@tableweave\/react\/reordering-controller$/,
        replacement: source("react/src/reordering-controller/index.ts"),
      },
      {
        find: /^@tableweave\/react\/reordering$/,
        replacement: source("react/src/reordering/index.ts"),
      },
      {
        find: /^@tableweave\/react$/,
        replacement: source("react/src/index.ts"),
      },
      {
        find: /^@tableweave\/heroui$/,
        replacement: source("heroui/src/index.ts"),
      },
    ],
  },
  test: {
    include: [
      "tests/workbench/wp11-next/server.test.ts",
      "tests/workbench/wp11-next/client.test.tsx",
    ],
    environment: "node",
  },
});
