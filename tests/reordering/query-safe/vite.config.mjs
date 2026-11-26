import { readFileSync } from "node:fs";
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
  return fileURLToPath(new URL(target.replaceAll("*", entry), manifest));
}
export default {
  root,
  cacheDir: join(cache, "vite"),
  esbuild: { jsx: "automatic" },
  plugins: [
    tailwindcss(),
    {
      name: "selected-public-peer-runtime",
      enforce: "pre",
      resolveId(id) {
        if (id.startsWith("@heroui/react/"))
          return publicRuntime(
            "@heroui/react",
            id.slice("@heroui/react/".length),
          );
        if (id === "react-aria-components/I18nProvider")
          return publicRuntime("react-aria-components", "I18nProvider");
      },
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
