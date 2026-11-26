import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const vendor = createRequire(
  new URL("../../packages/heroui/package.json", import.meta.url),
);
const native = createRequire(
  new URL("../../packages/react/package.json", import.meta.url),
);
export const aliases = [
  ...["", "/contracts", "/filters"].map((suffix) => ({
    find: new RegExp(`^@tableweave/react${suffix}$`),
    replacement: fileURLToPath(
      new URL(
        `../../packages/react/src/${suffix ? `${suffix.slice(1)}/` : ""}index.ts`,
        import.meta.url,
      ),
    ),
  })),
  {
    find: /^@tanstack\/react-table$/,
    replacement: native.resolve("@tanstack/react-table"),
  },
  ...[
    "react",
    "react-dom",
    "@internationalized/date",
    "react-aria-components",
  ].map((name) => ({
    find: name,
    replacement: dirname(vendor.resolve(`${name}/package.json`)),
  })),
  ...[
    "button",
    "calendar",
    "date-field",
    "date-picker",
    "date-range-picker",
    "label",
    "range-calendar",
    "input",
    "textfield",
    "time-field",
  ].map((name) => ({
    find: new RegExp(`^@heroui/react/${name}$`),
    replacement: vendor.resolve(`@heroui/react/${name}`),
  })),
];
