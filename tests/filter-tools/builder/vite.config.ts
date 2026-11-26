import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const vendor = createRequire(
  new URL("../../../apps/storybook/package.json", import.meta.url),
);
const { default: tailwind } = await import(vendor.resolve("@tailwindcss/vite"));
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(new URL("./.artifacts/vite", import.meta.url)),
  plugins: [tailwind()],
  resolve: {
    alias: {
      react: dirname(vendor.resolve("react/package.json")),
      "react-dom": dirname(vendor.resolve("react-dom/package.json")),
      "@tableweave/react/contracts": fileURLToPath(
        new URL(
          "../../../packages/react/src/contracts/index.ts",
          import.meta.url,
        ),
      ),
      "@tableweave/react/filters": fileURLToPath(
        new URL(
          "../../../packages/react/src/filters/index.ts",
          import.meta.url,
        ),
      ),
      "@tableweave/react": fileURLToPath(
        new URL("../../../packages/react/src/index.ts", import.meta.url),
      ),
      ...Object.fromEntries(
        [
          "button",
          "input",
          "label",
          "list-box",
          "popover",
          "textfield",
          "calendar",
          "date-field",
          "date-picker",
          "date-range-picker",
          "range-calendar",
          "time-field",
        ].map((name) => [
          `@heroui/react/${name}`,
          vendor.resolve(`@heroui/react/${name}`),
        ]),
      ),
      "@heroui/styles": vendor.resolve("@heroui/styles"),
      tailwindcss: `${dirname(vendor.resolve("tailwindcss/package.json"))}/index.css`,
      "@builder-source/styles.css": fileURLToPath(
        new URL("../../../packages/heroui/src/styles.css", import.meta.url),
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: { allow: [fileURLToPath(new URL("../../../", import.meta.url))] },
  },
});
