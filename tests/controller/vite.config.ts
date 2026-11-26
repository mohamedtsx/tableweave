import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Reuse installed vendor packages; do not add dependencies or alias Tableweave.
const vendor = createRequire(
  new URL("../../apps/storybook/package.json", import.meta.url),
);
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  resolve: {
    alias: {
      react: dirname(vendor.resolve("react/package.json")),
      "react-dom": dirname(vendor.resolve("react-dom/package.json")),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: { allow: [fileURLToPath(new URL("../../", import.meta.url))] },
  },
});
