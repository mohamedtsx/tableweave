import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: fileURLToPath(new URL("./.artifacts/vite", import.meta.url)),
  test: {
    include: [
      fileURLToPath(new URL("./capabilities.test.ts", import.meta.url)),
    ],
    environment: "node",
    maxWorkers: 1,
    fileParallelism: false,
  },
});
