import base from "../table-renderer-commit/vitest.config.mjs";
import { own } from "./scope-paths.mjs";
export default {
  ...base,
  cacheDir: `${own}/.artifacts/final-cache`,
  test: {
    ...base.test,
    include: ["tests/table-renderer-collection/*.test.{ts,tsx}"],
    outputFile: { json: `${own}/.artifacts/final-units.json` },
  },
};
