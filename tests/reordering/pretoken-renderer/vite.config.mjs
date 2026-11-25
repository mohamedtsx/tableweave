import base from "../neutral-consumer/vite.config.mjs";
export default {
  ...base,
  cacheDir: "tests/reordering/pretoken-renderer/.artifacts/vite-cache",
  server: { host: "127.0.0.1", port: 6566, strictPort: true },
};
