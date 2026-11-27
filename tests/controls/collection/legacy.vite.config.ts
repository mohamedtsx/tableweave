import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import base from "./vite.config.js";
export default defineConfig({
  ...base,
  root: fileURLToPath(new URL("../../native/collection/", import.meta.url)),
  cacheDir: fileURLToPath(new URL("./.artifacts/legacy-vite", import.meta.url)),
});
