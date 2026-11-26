import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const vendor = createRequire(
  new URL("../../../apps/storybook/package.json", import.meta.url),
);
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(new URL("./.artifacts/vite-cache", import.meta.url)),
  resolve: {
    alias: {
      react: dirname(vendor.resolve("react/package.json")),
      "react-dom": dirname(vendor.resolve("react-dom/package.json")),
      "@heroui/react/table": vendor.resolve("@heroui/react/table"),
      "@heroui/react/checkbox": vendor.resolve("@heroui/react/checkbox"),
      "@heroui/react/button": vendor.resolve("@heroui/react/button"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: { allow: [fileURLToPath(new URL("../../../", import.meta.url))] },
  },
});
