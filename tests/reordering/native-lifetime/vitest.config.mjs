import { defineConfig } from "vitest/config";
import base from "../../../vitest.config.ts";
export default defineConfig({
  resolve: base.resolve,
  test: {
    include: [
      "tests/reordering/native-lifetime/*.test.tsx",
      "tests/criteria-commit/cell.test.ts",
      "tests/criteria-commit/work.test.ts",
      "tests/criteria-facade-config/denial.test.ts",
    ],
    environment: "node",
  },
});
