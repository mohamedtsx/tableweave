import { defineConfig } from "vite";
import { aliases } from "./source-aliases.mjs";
export default defineConfig({
  cacheDir: "tests/criteria-commit/.artifacts/browser-cache",
  esbuild: { jsx: "automatic" },
  resolve: { alias: aliases },
  server: { host: "127.0.0.1", port: 4193, strictPort: true },
});
