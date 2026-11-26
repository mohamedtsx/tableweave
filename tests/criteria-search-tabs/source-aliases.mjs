import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const vendor = createRequire(
  new URL("../../apps/storybook/package.json", import.meta.url),
);
const native = createRequire(
  new URL("../../packages/react/package.json", import.meta.url),
);
export const aliases = [
  {
    find: /^@tableweave\/react$/,
    replacement: fileURLToPath(
      new URL("../../packages/react/src/index.ts", import.meta.url),
    ),
  },
  {
    find: /^@tableweave\/react\/contracts$/,
    replacement: fileURLToPath(
      new URL("../../packages/react/src/contracts/index.ts", import.meta.url),
    ),
  },
  {
    find: /^@tableweave\/react\/filters$/,
    replacement: fileURLToPath(
      new URL("../../packages/react/src/filters/index.ts", import.meta.url),
    ),
  },
  {
    find: /^@tanstack\/react-table$/,
    replacement: native.resolve("@tanstack/react-table"),
  },
  { find: "react", replacement: dirname(vendor.resolve("react/package.json")) },
  {
    find: "react-dom",
    replacement: dirname(vendor.resolve("react-dom/package.json")),
  },
  {
    find: /^@heroui\/react\/search-field$/,
    replacement: vendor.resolve("@heroui/react/search-field"),
  },
  {
    find: /^@heroui\/react\/tabs$/,
    replacement: vendor.resolve("@heroui/react/tabs"),
  },
];
