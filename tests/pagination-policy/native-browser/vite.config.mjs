import { defineConfig } from "vite";
import {
  declared,
  packageRoot,
  sourceAliases,
} from "../../controls/harness/resolve.mjs";
import { own, root } from "./guard.mjs";

const tailwind = (await import(declared("@tailwindcss/vite", "storybook")))
  .default;
export default defineConfig({
  root: own,
  cacheDir: `${own}/.artifacts/vite-cache`,
  plugins: [tailwind()],
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      ...sourceAliases(),
      { find: "react", replacement: packageRoot("react") },
      { find: "react-dom", replacement: packageRoot("react-dom") },
      ...["table", "button", "checkbox"].map((name) => ({
        find: `@heroui/react/${name}`,
        replacement: declared(`@heroui/react/${name}`),
      })),
      {
        find: /^@heroui\/styles\/css$/,
        replacement: declared("@heroui/styles/css"),
      },
      { find: /^tailwindcss$/, replacement: declared("tailwindcss/index.css") },
    ],
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: "127.0.0.1",
    port: 6541,
    strictPort: true,
    fs: { allow: [root] },
    hmr: false,
    watch: { ignored: ["**/.artifacts/**"] },
  },
});
