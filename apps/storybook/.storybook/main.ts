import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const vendor = createRequire(new URL("../package.json", import.meta.url));
const tableweaveEntries = [
  ["@tableweave/react/contracts", "react/dist/contracts/index.js"],
  ["@tableweave/react/filters", "react/dist/filters/index.js"],
  ["@tableweave/react", "react/dist/index.js"],
  ["@tableweave/heroui", "heroui/dist/index.js"],
] as const;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  framework: "@storybook/react-vite",
  addons: [],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        // Shared synthetic fixtures live outside this app's dependency directory.
        // Resolve through the actual declaring app, never library source aliases.
        alias: [
          {
            find: "react",
            replacement: dirname(vendor.resolve("react/package.json")),
          },
          {
            find: "react-dom",
            replacement: dirname(vendor.resolve("react-dom/package.json")),
          },
          ...tableweaveEntries.map(([name, path]) => ({
            find: new RegExp(`^${name.replaceAll("/", "\\/")}$`),
            replacement: fileURLToPath(
              new URL(`../../../packages/${path}`, import.meta.url),
            ),
          })),
          {
            find: "react-aria-components/I18nProvider",
            replacement: vendor.resolve("react-aria-components/I18nProvider"),
          },
        ],
      },
    });
  },
};

export default config;
