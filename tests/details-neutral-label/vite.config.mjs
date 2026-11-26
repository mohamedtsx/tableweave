import { join } from "node:path";
import base from "../data-table/details-accessory/vite.config.mjs";
import { own } from "./scope.mjs";
export default {
  ...base,
  cacheDir: join(own, ".artifacts/final-vite-cache"),
  server: { host: "127.0.0.1", port: 6578, strictPort: true },
};
