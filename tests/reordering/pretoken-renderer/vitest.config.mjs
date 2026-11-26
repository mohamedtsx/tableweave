import base from "../neutral-consumer/vitest.config.mjs";
export default {
  ...base,
  test: {
    include: ["tests/reordering/pretoken-renderer/denial.test.tsx"],
    environment: "node",
  },
};
