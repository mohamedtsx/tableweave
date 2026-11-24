import { defineConfig } from "vitest/config";
import vite from "./vite.config.js";

export default defineConfig({
  ...vite,
  test: { include: ["*.test.ts", "*.test.tsx"], environment: "node" },
});
