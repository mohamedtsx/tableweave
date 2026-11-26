import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import base from "../../data-table/details-accessory/vite.config.mjs";
export default defineConfig({
  ...base,
  cacheDir: "tests/reordering/neutral-consumer/.artifacts/vite-cache",
  resolve: {
    ...base.resolve,
    alias: [
      {
        find: /^@tableweave\/react\/reordering-controller$/,
        replacement: fileURLToPath(
          new URL(
            "../../../packages/react/src/reordering-controller/index.ts",
            import.meta.url,
          ),
        ),
      },
      {
        find: /^@tableweave\/react\/reordering$/,
        replacement: fileURLToPath(
          new URL(
            "../../../packages/react/src/reordering/index.ts",
            import.meta.url,
          ),
        ),
      },
      ...base.resolve.alias,
    ],
  },
  server: { host: "127.0.0.1", port: 6565, strictPort: true },
});
