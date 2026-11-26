import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const requireReactPackage = createRequire(
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
    replacement: requireReactPackage.resolve("@tanstack/react-table"),
  },
];
