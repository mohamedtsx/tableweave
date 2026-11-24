import { createRequire } from "node:module";
import { aliases as previous } from "../criteria-date/source-aliases.mjs";
const vendor = createRequire(new URL("../../packages/heroui/package.json", import.meta.url));
export const aliases = [...previous, ...["list-box", "popover"].map(name => ({
  find: new RegExp(`^@heroui/react/${name}$`), replacement: vendor.resolve(`@heroui/react/${name}`),
}))];
