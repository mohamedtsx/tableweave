import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "../../../apps/storybook/node_modules/@tailwindcss/vite/dist/index.mjs";

const vendor = createRequire(
  new URL("../../../apps/storybook/package.json", import.meta.url),
);
const file = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  root: file("./"),
  cacheDir: file("./.artifacts/vite-cache"),
  plugins: [tailwindcss()],
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      {
        find: /^react$/,
        replacement: dirname(vendor.resolve("react/package.json")),
      },
      {
        find: /^react\//,
        replacement: `${dirname(vendor.resolve("react/package.json"))}/`,
      },
      {
        find: /^react-dom$/,
        replacement: dirname(vendor.resolve("react-dom/package.json")),
      },
      {
        find: /^react-dom\//,
        replacement: `${dirname(vendor.resolve("react-dom/package.json"))}/`,
      },
      {
        find: /^tailwindcss$/,
        replacement: file(
          "../../../apps/storybook/node_modules/tailwindcss/index.css",
        ),
      },
      {
        find: /^@heroui\/styles$/,
        replacement: vendor.resolve("@heroui/styles"),
      },
      {
        find: /^react-aria-components\/I18nProvider$/,
        // Public ESM export, matching the widgets' import condition/context.
        replacement: file(
          "../../../apps/storybook/node_modules/react-aria-components/dist/exports/I18nProvider.mjs",
        ),
      },
      // Emitted workspace public entries only. This is not clean tarball proof;
      // the main packed consumer must resolve these package names with NO aliases.
      {
        find: /^@tableweave\/react\/contracts$/,
        replacement: file("../../../packages/react/dist/contracts/index.js"),
      },
      {
        find: /^@tableweave\/react\/filters$/,
        replacement: file("../../../packages/react/dist/filters/index.js"),
      },
      {
        find: /^@tableweave\/react$/,
        replacement: file("../../../packages/react/dist/index.js"),
      },
      {
        find: /^@tableweave\/heroui\/styles\.css$/,
        replacement: file("../../../packages/heroui/dist/styles.css"),
      },
      {
        find: /^@tableweave\/heroui$/,
        replacement: file("../../../packages/heroui/dist/index.js"),
      },
    ],
    dedupe: ["react", "react-dom"],
  },
  server: { fs: { allow: [file("../../../")] } },
});
