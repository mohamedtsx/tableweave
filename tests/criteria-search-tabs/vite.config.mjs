import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "../../apps/storybook/node_modules/@tailwindcss/vite/dist/index.mjs";
import { aliases } from "./source-aliases.mjs";
export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: { jsx: "automatic" },
  root: fileURLToPath(new URL("../../", import.meta.url)),
  cacheDir: fileURLToPath(
    new URL("./.artifacts/browser-cache", import.meta.url),
  ),
  resolve: { alias: aliases, dedupe: ["react", "react-dom"] },
  server: { host: "127.0.0.1", port: 6547, strictPort: true },
});
