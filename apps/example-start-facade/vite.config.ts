import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// Standard generation is enabled. Invoke plugins only in the FINAL phase.
const vendor = createRequire(new URL("./package.json", import.meta.url));
const publicEntries = [
  "@tableweave/react",
  "@tableweave/react/contracts",
  "@tableweave/react/filters",
  "@tableweave/react/criteria",
  "@tableweave/react/reordering",
  "@tableweave/react/reordering-controller",
] as const;
export default defineConfig({
  plugins: [tanstackStart(), react()],
  resolve: {
    alias: [
      // ESM resolution honors actual public exports; CJS require.resolve would reject
      // the import-only library. Works with emitted workspace or a genuine archive.
      ...publicEntries.map((name) => ({
        find: new RegExp(`^${name.replaceAll(".", "\\.")}$`),
        replacement: fileURLToPath(import.meta.resolve(name)),
      })),
      {
        find: "react",
        replacement: dirname(vendor.resolve("react/package.json")),
      },
      {
        find: "react-dom",
        replacement: dirname(vendor.resolve("react-dom/package.json")),
      },
    ],
  },
  server: { host: "127.0.0.1", port: 6573, strictPort: true },
  preview: { host: "127.0.0.1", port: 6573, strictPort: true },
});
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
