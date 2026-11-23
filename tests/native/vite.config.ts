import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const vendor = createRequire(
  new URL("../../packages/react/package.json", import.meta.url),
);
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: "/tmp/opencode/tableweave-native-browser-vite",
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
