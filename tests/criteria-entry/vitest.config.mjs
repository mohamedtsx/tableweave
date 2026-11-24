import { join } from "node:path";
import { own, root } from "./scope.mjs";
export default {
  root,
  cacheDir: join(own, ".artifacts/final-cache"),
  resolve: {
    alias: [
      {
        find: /^@tableweave\/react\/criteria$/,
        replacement: join(root, "packages/react/src/criteria/index.ts"),
      },
    ],
  },
  test: {
    include: ["tests/criteria-entry/source.test.ts"],
    environment: "node",
    maxWorkers: 1,
    fileParallelism: false,
    watch: false,
    forbidOnly: true,
    retry: 0,
    reporters: ["default", "json"],
    outputFile: { json: join(own, ".artifacts/final-source-test.json") },
  },
};
