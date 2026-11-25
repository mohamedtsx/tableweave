import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root,
  cacheDir: "../wp14-cache",
  plugins: [
    react(),
    tailwind(),
    {
      name: "wp14-actual-bundle-graph",
      generateBundle(_options, bundle) {
        const target = resolve(root, "../wp14-bundle.json");
        if (existsSync(target)) throw new Error("E_BUNDLE_RECEIPT_EXISTS");
        const chunks = Object.fromEntries(
          Object.entries(bundle).map(([key, entry]) => [
            key,
            entry.type === "chunk"
              ? {
                  type: entry.type,
                  modules: Object.fromEntries(
                    Object.entries(entry.modules).map(([id, value]) => [
                      id,
                      {
                        renderedLength: value.renderedLength,
                        originalLength: value.originalLength,
                      },
                    ]),
                  ),
                  imports: entry.imports,
                  dynamicImports: entry.dynamicImports,
                }
              : { type: entry.type },
          ]),
        );
        writeFileSync(
          target,
          `${JSON.stringify({ status: "actual-rollup-module-observations-not-performance-proof", chunks }, null, 2)}\n`,
          { flag: "wx" },
        );
      },
    },
  ],
  build: {
    outDir: "../wp14-dist",
    emptyOutDir: false,
    sourcemap: false,
    manifest: true,
  },
  server: { host: "127.0.0.1", port: 6576, strictPort: true },
  preview: { host: "127.0.0.1", port: 6576, strictPort: true },
});
