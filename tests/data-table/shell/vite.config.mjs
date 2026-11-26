import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "../../../apps/storybook/node_modules/@tailwindcss/vite/dist/index.mjs";
import { aliases } from "../../criteria-search-tabs/source-aliases.mjs";
export default defineConfig({
  plugins: [tailwindcss()],
  root: fileURLToPath(new URL("../../../", import.meta.url)),
  cacheDir: fileURLToPath(new URL(".artifacts/vite-cache/", import.meta.url)),
  resolve: {
    alias: [
      ...aliases,
      {
        find: /^@tableweave\/heroui\/styles\.css$/,
        replacement: fileURLToPath(
          new URL("../../../packages/heroui/src/styles.css", import.meta.url),
        ),
      },
    ],
    dedupe: ["react", "react-dom"],
  },
  esbuild: { jsx: "automatic" },
  server: { host: "127.0.0.1", port: 6580, strictPort: true },
});
