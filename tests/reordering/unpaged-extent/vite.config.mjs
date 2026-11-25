import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { aliases } from "../../criteria-search-tabs/source-aliases.mjs";

export default defineConfig({
  root: fileURLToPath(new URL("../../../", import.meta.url)),
  cacheDir: "tests/reordering/unpaged-extent/.artifacts/browser-cache",
  resolve: { alias: aliases, dedupe: ["react", "react-dom"] },
  esbuild: { jsx: "automatic" },
  server: { host: "127.0.0.1", port: 6562, strictPort: true },
});
