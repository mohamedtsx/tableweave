import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const source = (path) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@tableweave\/react\/reordering-controller$/,
        replacement: source(
          "../../../packages/react/src/reordering-controller/index.ts",
        ),
      },
      {
        find: /^@tableweave\/react\/reordering$/,
        replacement: source("../../../packages/react/src/reordering/index.ts"),
      },
      {
        find: /^@tableweave\/react\/contracts$/,
        replacement: source("../../../packages/react/src/contracts/index.ts"),
      },
      {
        find: /^@tableweave\/react\/filters$/,
        replacement: source("../../../packages/react/src/filters/index.ts"),
      },
      {
        find: /^@tableweave\/react$/,
        replacement: source("../../../packages/react/src/index.ts"),
      },
    ],
  },
  test: {
    include: ["tests/reordering/neutral-consumer/denial.test.tsx"],
    environment: "node",
  },
});
