import { defineConfig } from "vite";
import base from "../fence-domains/vite.config.mjs";
export default defineConfig({
  ...base,
  cacheDir: "tests/reordering/interaction-cut/.artifacts/browser-cache",
  server: { host: "127.0.0.1", port: 6565, strictPort: true },
});
