import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "vite";

// Declaring-app tooling only. This does not import a Storybook host/config/runtime.
const vendor = createRequire(
  new URL("../../../apps/storybook/package.json", import.meta.url),
);
const react: typeof import("@vitejs/plugin-react") = await import(
  pathToFileURL(vendor.resolve("@vitejs/plugin-react")).href
);
const tailwind: typeof import("@tailwindcss/vite") = await import(
  pathToFileURL(vendor.resolve("@tailwindcss/vite")).href
);
const path = (value: string) => fileURLToPath(new URL(value, import.meta.url));
const run = process.env.WP12_RUN;
if (!run || !/^[a-zA-Z0-9-]{1,64}$/.test(run))
  throw new Error("Select a fresh WP12_RUN before final runtime");
// Finite PUBLIC EMITTED entries, never source/runtime or archive aliases.
const entries = [
  ["@tableweave/react", "react/dist/index.js"],
  ["@tableweave/react/contracts", "react/dist/contracts/index.js"],
  ["@tableweave/react/filters", "react/dist/filters/index.js"],
  [
    "@tableweave/react/reordering-controller",
    "react/dist/reordering-controller/index.js",
  ],
  ["@tableweave/react/reordering", "react/dist/reordering/index.js"],
  ["@tableweave/heroui", "heroui/dist/index.js"],
  ["@tableweave/heroui/styles.css", "heroui/dist/styles.css"],
] as const;
export default defineConfig({
  root: path("./"),
  plugins: [react.default(), tailwind.default()],
  resolve: {
    alias: [
      ...entries.map(([name, target]) => ({
        find: new RegExp(`^${name.replaceAll(".", "\\.")}$`),
        replacement: path(`../../../packages/${target}`),
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
  cacheDir: path(`./evidence/.runtime/${run}/vite-cache/`),
  server: {
    host: "127.0.0.1",
    port: 6574,
    strictPort: true,
    fs: {
      strict: true,
      allow: [
        path("./"),
        path("../../../apps/examples/shared/"),
        path("../../../apps/examples/recipes/"),
        path("../../../packages/react/dist/"),
        path("../../../packages/heroui/dist/"),
        path("../../../node_modules/"),
        path("../../../apps/storybook/node_modules/"),
      ],
      deny: [
        ".env",
        ".env.*",
        "**/.npmrc",
        "**/.git/**",
        "**/.repo/**",
        "**/*.{crt,pem,key}",
        "**/evidence/preimages/**",
        "**/evidence/.artifacts/**",
        "**/evidence/*.json",
        "**/evidence/*.mjs",
        "**/evidence/.runtime/**/browser-results/**",
        "**/evidence/.runtime/**/report/**",
        "**/evidence/.runtime/**/vite-dist/**",
        "**/*.md",
        "**/browser.spec.ts",
        "**/*.config.ts",
        "**/tsconfig*.json",
      ],
    },
  },
  preview: { host: "127.0.0.1", port: 6574, strictPort: true },
  build: {
    outDir: path(`./evidence/.runtime/${run}/vite-dist/`),
    emptyOutDir: false,
    manifest: true,
    rollupOptions: { input: path("./index.html") },
  },
});
