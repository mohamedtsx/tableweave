import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const vendor = createRequire(new URL("../package.json", import.meta.url));
// Storybook's TypeScript loader can redirect require.resolve through declaration
// paths. Runtime aliases must use the package's actual public ESM export instead.
function publicImport(packageName: string, entry: string) {
  const manifestUrl = new URL(
    `../node_modules/${packageName}/package.json`,
    import.meta.url,
  );
  const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
  const key = `./${entry}`;
  const exported = Object.hasOwn(manifest.exports, key)
    ? manifest.exports[key]
    : manifest.exports["./*"];
  const target: unknown = exported?.import;
  if (
    typeof target !== "string" ||
    !target.startsWith("./dist/") ||
    target.split("/").includes("..") ||
    !/\.m?js$/.test(target)
  )
    throw new Error(`Missing public runtime export: ${packageName}/${entry}`);
  return fileURLToPath(new URL(target.replaceAll("*", entry), manifestUrl));
}
const tableweaveEntries = [
  ["@tableweave/react/contracts", "react/dist/contracts/index.js"],
  ["@tableweave/react/filters", "react/dist/filters/index.js"],
  ["@tableweave/react/reordering", "react/dist/reordering/index.js"],
  [
    "@tableweave/react/reordering-controller",
    "react/dist/reordering-controller/index.js",
  ],
  ["@tableweave/react", "react/dist/index.js"],
  ["@tableweave/heroui", "heroui/dist/index.js"],
] as const;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  framework: "@storybook/react-vite",
  addons: [],
  // This interaction catalog uses story args, not generated prop documentation.
  // Docgen recurses through emitted controller helpers; tsc remains the type gate.
  typescript: { reactDocgen: false },
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      // Shared example TSX has no app-local tsconfig; never emit an unbound React
      // global for those components. This matches the catalog's automatic runtime.
      esbuild: { jsx: "automatic" },
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
          {
            find: "@heroui/react/button",
            replacement: publicImport("@heroui/react", "button"),
          },
          ...tableweaveEntries.map(([name, path]) => ({
            find: new RegExp(`^${name.replaceAll("/", "\\/")}$`),
            replacement: fileURLToPath(
              new URL(`../../../packages/${path}`, import.meta.url),
            ),
          })),
          {
            find: "react-aria-components/I18nProvider",
            replacement: publicImport("react-aria-components", "I18nProvider"),
          },
        ],
      },
    });
  },
};

export default config;
