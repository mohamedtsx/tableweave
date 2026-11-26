import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "../../../apps/storybook/node_modules/@tailwindcss/vite/dist/index.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url)).replace(
  /\/$/,
  "",
);
const own =
  "/mnt/data/Projects/tableweave-final-verification-cand001/wp13-run-cand001/storybook-ready";
const label = process.env.TABLEWEAVE_SOURCE_BROWSER_RUN;
if (
  root !== "/tmp/opencode/tableweave-wp11-workbench" ||
  !/^[0-9]{3}$/.test(label ?? "")
)
  throw new Error("Explicit primary source-browser selection required");
const cache = join(own, `source-browser-${label}-cache`);
const vendor = createRequire(join(root, "apps/storybook/package.json"));
const native = createRequire(join(root, "packages/react/package.json"));
const aria = createRequire(vendor.resolve("react-aria/package.json"));
const commonJS = [
  "use-sync-external-store/shim/index.js",
  "use-sync-external-store/shim/with-selector",
];
function publicRuntime(packageName, entry) {
  if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(entry))
    throw new Error("Public component entry must be a single segment");
  const manifest = new URL(
    `../../../apps/storybook/node_modules/${packageName}/package.json`,
    import.meta.url,
  );
  const exports = JSON.parse(readFileSync(manifest, "utf8")).exports;
  const target = (exports[`./${entry}`] ?? exports["./*"])?.import;
  if (
    typeof target !== "string" ||
    !target.startsWith("./dist/") ||
    target.split("/").includes("..") ||
    !/\.m?js$/.test(target)
  )
    throw new Error("Missing pinned public ESM runtime");
  return realpathSync(
    fileURLToPath(new URL(target.replaceAll("*", entry), manifest)),
  );
}
const publicPeerEntries = [
  ...[
    "button",
    "button-group",
    "calendar",
    "checkbox",
    "date-field",
    "date-picker",
    "date-range-picker",
    "drawer",
    "dropdown",
    "input",
    "label",
    "list-box",
    "pagination",
    "popover",
    "range-calendar",
    "search-field",
    "select",
    "table",
    "tabs",
    "textfield",
    "time-field",
  ].map((entry) => ["@heroui/react", entry]),
  ["react-aria-components", "I18nProvider"],
];
export default {
  root,
  cacheDir: join(cache, "vite"),
  esbuild: { jsx: "automatic" },
  plugins: [
    tailwindcss(),
    {
      name: "selected-public-peer-runtime",
      enforce: "pre",
      load(id) {
        if (/\/packages\/(react|heroui)\/dist\//.test(id))
          throw new Error(
            "Emitted library is outside this source-browser profile",
          );
      },
    },
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      // Standard aliases preserve Vite's optimized-dependency lookup. A custom
      // resolveId returning raw peer files would duplicate collection contexts.
      ...publicPeerEntries.map(([packageName, entry]) => ({
        find: new RegExp(`^${packageName}/${entry}$`),
        replacement: publicRuntime(packageName, entry),
      })),
      // These transitive public CJS entries need Vite's real prebundle, not raw
      // browser ESM loading. Resolve from their actual declaring peer dependency.
      ...commonJS.map((entry) => ({
        find: new RegExp(`^${entry.replaceAll(".", "\\.")}$`),
        replacement: aria.resolve(entry),
      })),
      {
        find: /^@tableweave\/heroui\/styles\.css$/,
        replacement: join(root, "packages/heroui/src/styles.css"),
      },
      ...[
        "contracts",
        "filters",
        "criteria",
        "reordering",
        "reordering-controller",
      ].map((entry) => ({
        find: new RegExp(`^@tableweave/react/${entry}$`),
        replacement: join(root, `packages/react/src/${entry}/index.ts`),
      })),
      {
        find: /^@tableweave\/react$/,
        replacement: join(root, "packages/react/src/index.ts"),
      },
      {
        find: /^@tableweave\/heroui$/,
        replacement: join(root, "packages/heroui/src/index.ts"),
      },
      {
        find: /^@tanstack\/react-table$/,
        replacement: native.resolve("@tanstack/react-table"),
      },
      {
        find: "react",
        replacement: dirname(vendor.resolve("react/package.json")),
      },
      {
        find: "react-dom",
        replacement: dirname(vendor.resolve("react-dom/package.json")),
      },
    ],
  },
  optimizeDeps: {
    include: commonJS,
    entries: [
      "tests/reordering/query-safe/browser.html",
      "tests/reordering/grouped-data-table/browser.html",
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 6570,
    strictPort: true,
    fs: {
      strict: true,
      allow: [root, cache],
      deny: [
        ".env",
        ".env.*",
        "**/*.{crt,pem,key}",
        "**/.git/**",
        "**/.repo/**",
      ],
    },
  },
};
