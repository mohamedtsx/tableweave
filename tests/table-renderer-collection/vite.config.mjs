import base from "./vitest.config.mjs";
export default {
  root: base.root,
  resolve: base.resolve,
  plugins: base.plugins,
  cacheDir: base.cacheDir,
  server: { host: "127.0.0.1", port: 6551, strictPort: true },
};
