import { realpathSync } from "node:fs";
import { join, sep } from "node:path";
import { defineConfig } from "vite";
import { archiveRoot, confinedRequire } from "./archive-stage.mjs";

const root = archiveRoot();
const declared = confinedRequire(root);
const { default: tailwind } = await import(declared("@tailwindcss/vite"));
export default defineConfig({
  root: join(root, "tests/controls/integration"),
  cacheDir: join(root, ".vite-controls"),
  esbuild: { jsx: "automatic" },
  plugins: [
    tailwind(),
    {
      name: "confine-archive-application-resolution",
      enforce: "pre",
      async resolveId(source, importer, options) {
        const found = await this.resolve(source, importer, {
          ...options,
          skipSelf: true,
        });
        if (!found || found.id.startsWith("\0")) return found;
        const file = found.id.split("?")[0];
        if (
          file?.startsWith("/") &&
          !realpathSync(file).startsWith(`${root}${sep}`)
        )
          throw new Error(`External archive runtime module refused: ${source}`);
        return found;
      },
    },
  ],
  // Deliberately NO public/vendor aliases or outside-stage filesystem allowlist.
  resolve: {
    dedupe: ["react", "react-dom", "react-aria", "react-aria-components"],
  },
  server: { fs: { strict: true, allow: [root] } },
});
