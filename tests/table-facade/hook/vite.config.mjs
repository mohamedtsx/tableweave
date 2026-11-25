import config from "./vitest.config.mjs";
export default {
  root: config.root,
  resolve: config.resolve,
  plugins: config.plugins,
  cacheDir: config.cacheDir,
  optimizeDeps: { entries: ["tests/table-facade/hook/react.html"] },
  server: { host: "127.0.0.1", port: 6548, strictPort: true },
};
