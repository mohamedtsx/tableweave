import { defineConfig } from "vite";
import { declared } from "../../controls/harness/resolve.mjs";
import { aliases } from "./aliases.mjs";
import { own, root } from "./guard.mjs";

const tailwind = (await import(declared("@tailwindcss/vite", "storybook")))
  .default;
export default defineConfig({
  root: own,
  cacheDir: `${own}/.artifacts/vite-cache`,
  plugins: [tailwind()],
  esbuild: { jsx: "automatic" },
  resolve: { alias: aliases(), dedupe: ["react", "react-dom"] },
  server: {
    host: "127.0.0.1",
    port: 6543,
    strictPort: true,
    hmr: false,
    fs: { allow: [root] },
    watch: { ignored: ["**/.artifacts/**"] },
  },
});
