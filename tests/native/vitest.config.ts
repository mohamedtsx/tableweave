import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: "/tmp/opencode/tableweave-native-vite",
  test: {
    include: ["tests/native/*.test.ts"],
    environment: "node",
  },
});
