import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const vendor = createRequire(new URL("./package.json", import.meta.url));
const path = (value: string) => fileURLToPath(new URL(value, import.meta.url));
// Finite PUBLIC emitted entries. Source aliases exist only in the LIGHT configs.
const entries = [
  ["@tableweave/react", "react/dist/index.js"],
  ["@tableweave/react/contracts", "react/dist/contracts/index.js"],
  ["@tableweave/react/filters", "react/dist/filters/index.js"],
  ["@tableweave/react/criteria", "react/dist/criteria/index.js"],
  [
    "@tableweave/react/reordering-controller",
    "react/dist/reordering-controller/index.js",
  ],
  ["@tableweave/react/reordering", "react/dist/reordering/index.js"],
  ["@tableweave/heroui", "heroui/dist/index.js"],
  ["@tableweave/heroui/styles.css", "heroui/dist/styles.css"],
] as const;
export default defineConfig({
  root: path("../examples/vite/"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      ...entries.map(([name, target]) => ({
        find: new RegExp(`^${name.replaceAll(".", "\\.")}$`),
        replacement: path(`../../packages/${target}`),
      })),
      {
        find: "react",
        replacement: dirname(vendor.resolve("react/package.json")),
      },
      {
        find: "react-dom",
        replacement: dirname(vendor.resolve("react-dom/package.json")),
      },
      {
        find: /^@heroui\/react\/button$/,
        replacement: vendor.resolve("@heroui/react/button"),
      },
      {
        find: /^react-aria\/I18nProvider$/,
        replacement: vendor.resolve("react-aria/I18nProvider"),
      },
      {
        find: /^@heroui\/styles\/css$/,
        replacement: vendor.resolve("@heroui/styles/css"),
      },
      {
        find: /^tailwindcss$/,
        replacement: vendor.resolve("tailwindcss/index.css"),
      },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 6572,
    strictPort: true,
    fs: {
      strict: true,
      allow: [
        path("../examples/vite/"),
        path("../examples/shared/"),
        path("../examples/recipes/"),
        path("../../packages/react/dist/"),
        path("../../packages/heroui/dist/"),
        path("../../node_modules/"),
        path("./node_modules/"),
      ],
      deny: [
        ".env",
        ".env.*",
        "**/.npmrc",
        "*.{crt,pem}",
        "**/.git/**",
        "**/.repo/**",
      ],
    },
  },
  preview: { host: "127.0.0.1", port: 6572, strictPort: true },
  build: {
    outDir: path("../../tests/workbench/wp11-examples/.artifacts/vite-dist/"),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        styled: path("../examples/vite/index.html"),
        headless: path("../examples/vite/headless.html"),
      },
    },
  },
});
