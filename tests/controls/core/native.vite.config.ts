import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { root, runtimeAliases } from "../harness/resolve.mjs";
export default defineConfig({
  root: fileURLToPath(new URL("../../native/", import.meta.url)),
  cacheDir: fileURLToPath(
    new URL("./.artifacts/native-browser-vite-portable", import.meta.url),
  ),
  resolve: { alias: runtimeAliases(), dedupe: ["react", "react-dom"] },
  server: { fs: { allow: [root] } },
});
