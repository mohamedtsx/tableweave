import { defineConfig } from "vite";
import base from "../criteria-facade-config/vite.config.mjs";

export default defineConfig({
  ...base,
  cacheDir: "tests/criteria-facade-builder/.artifacts/browser-cache",
  server: { host: "127.0.0.1", port: 6555, strictPort: true },
});
