import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import {
  appRequire,
  publicEntry,
  vendorRoot,
  workspace,
} from "./public-roots.mjs";

const herouiRequire = createRequire(
  appRequire.resolve("@heroui/react/package.json"),
);
const { default: tailwind } = await import(
  appRequire.resolve("@tailwindcss/vite")
);
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(new URL("./.artifacts/vite", import.meta.url)),
  plugins: [tailwind()],
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      {
        find: "@tableweave/react/contracts",
        replacement: publicEntry("react", "./contracts"),
      },
      { find: /^@tableweave\/react$/, replacement: publicEntry("react") },
      {
        find: "@tableweave/heroui/styles.css",
        replacement: publicEntry("heroui", "./styles.css"),
      },
      { find: /^@tableweave\/heroui$/, replacement: publicEntry("heroui") },
      {
        find: "@heroui/styles/css",
        replacement: appRequire.resolve("@heroui/styles/css"),
      },
      {
        find: "tailwindcss",
        replacement: appRequire.resolve("tailwindcss/index.css"),
      },
      ...[
        "button",
        "button-group",
        "checkbox",
        "label",
        "list-box",
        "pagination",
        "popover",
        "select",
        "table",
      ].map((name) => ({
        find: `@heroui/react/${name}`,
        replacement: appRequire.resolve(`@heroui/react/${name}`),
      })),
      {
        find: "react-aria-components",
        replacement: vendorRoot(herouiRequire, "react-aria-components"),
      },
      { find: "react-aria", replacement: vendorRoot(appRequire, "react-aria") },
      {
        find: "react-dom",
        replacement: dirname(appRequire.resolve("react-dom/package.json")),
      },
      {
        find: "react",
        replacement: dirname(appRequire.resolve("react/package.json")),
      },
    ],
    dedupe: ["react", "react-dom", "react-aria-components", "react-aria"],
  },
  server: { fs: { allow: [workspace] } },
});
