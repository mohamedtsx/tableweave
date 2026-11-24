import { defineConfig } from "vitest/config";
import base from "../../../vitest.config.ts";
export default defineConfig({
  resolve: base.resolve,
  test: {
    include: ["tests/data-table/details-accessory/*.test.{ts,tsx}"],
    environment: "node",
  },
});
