import { defineConfig } from "vite";
import base from "../ui-bridge/vite.config.mjs";
export default defineConfig({
  ...base,
  cacheDir: "tests/reordering/fence-domains/.artifacts/browser-cache",
  server: { host: "127.0.0.1", port: 6564, strictPort: true },
});
