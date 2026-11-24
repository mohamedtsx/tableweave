import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "../../../apps/storybook/node_modules/@tailwindcss/vite/dist/index.mjs";

const vendor = createRequire(
  new URL("../../../apps/storybook/package.json", import.meta.url),
);
export default defineConfig({
  plugins: [tailwindcss()],
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(new URL("./.artifacts/vite-cache", import.meta.url)),
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
      "@heroui/react": `${dirname(vendor.resolve("@heroui/react/package.json"))}/dist/components`,
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: { allow: [fileURLToPath(new URL("../../../", import.meta.url))] },
  },
});
