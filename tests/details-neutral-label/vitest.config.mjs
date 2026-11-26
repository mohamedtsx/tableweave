import { join } from "node:path";
import base from "../data-table/details-accessory/vitest.config.mjs";
import { own } from "./scope.mjs";
export default {
  ...base,
  cacheDir: join(own, ".artifacts/final-cache"),
  test: {
    ...base.test,
    include: ["tests/details-neutral-label/*.test.tsx"],
    watch: false,
    maxWorkers: 1,
    fileParallelism: false,
    forbidOnly: true,
    retry: 0,
    reporters: ["default", "json"],
    outputFile: { json: join(own, ".artifacts/final-unit-ssr.json") },
  },
};
