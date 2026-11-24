import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import {
  appRequire,
  assertCapturedGeneration,
  confined,
  generationDirectory,
  publicEntry,
  workspace,
} from "./roots.mjs";

// This profile cannot run on the historical old180 outputs, even accidentally.
assertCapturedGeneration();
const { default: tailwind } = await import(
  confined(appRequire.resolve("@tailwindcss/vite"))
);
const herouiRequire = createRequire(
  confined(appRequire.resolve("@heroui/react/package.json")),
);
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: `${generationDirectory()}/vite`,
  esbuild: { jsx: "automatic" },
  plugins: [
    tailwind(),
    {
      name: "real-public-focus-handoff-inputs",
      enforce: "pre",
      load(id) {
        if (id.startsWith("\0")) return null;
        const path = id.split("?")[0];
        if (path?.startsWith("/") && existsSync(path)) {
          const actual = confined(path);
          if (/\/packages\/(?:react|heroui)\/src\//.test(actual))
            throw new Error(`Runtime source fallback refused: ${id}`);
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: "@tableweave/react/contracts",
        replacement: publicEntry("react", "./contracts"),
      },
      {
        find: "@tableweave/react/filters",
        replacement: publicEntry("react", "./filters"),
      },
      { find: /^@tableweave\/react$/, replacement: publicEntry("react") },
      {
        find: "@tableweave/heroui/styles.css",
        replacement: publicEntry("heroui", "./styles.css"),
      },
      { find: /^@tableweave\/heroui$/, replacement: publicEntry("heroui") },
      {
        find: "@heroui/styles/css",
        replacement: confined(appRequire.resolve("@heroui/styles/css")),
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
        "input",
        "textfield",
        "tabs",
        "search-field",
        "calendar",
        "date-field",
        "date-picker",
        "date-range-picker",
        "range-calendar",
        "time-field",
      ].map((name) => ({
        find: `@heroui/react/${name}`,
        replacement: confined(appRequire.resolve(`@heroui/react/${name}`)),
      })),
      {
        find: "react-aria-components",
        replacement: dirname(
          confined(herouiRequire.resolve("react-aria-components/package.json")),
        ),
      },
      {
        find: "react-aria",
        replacement: dirname(
          confined(appRequire.resolve("react-aria/package.json")),
        ),
      },
      {
        find: "tailwindcss",
        replacement: confined(appRequire.resolve("tailwindcss/index.css")),
      },
      {
        find: "react-dom",
        replacement: dirname(
          confined(appRequire.resolve("react-dom/package.json")),
        ),
      },
      {
        find: "react",
        replacement: dirname(
          confined(appRequire.resolve("react/package.json")),
        ),
      },
    ],
    dedupe: ["react", "react-dom", "react-aria", "react-aria-components"],
  },
  server: { fs: { strict: true, allow: [workspace] } },
});
