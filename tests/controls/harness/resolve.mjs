import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../../../", import.meta.url));
const issuers = {
  root: resolve(root, "package.json"),
  heroui: resolve(root, "packages/heroui/package.json"),
  react: resolve(root, "packages/react/package.json"),
  storybook: resolve(root, "apps/storybook/package.json"),
};
export const rootRequire = createRequire(issuers.root);
export const vendor = createRequire(issuers.heroui);
export const storybook = createRequire(issuers.storybook);
const packageName = (specifier) =>
  specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
const withinRoot = (file) => {
  const path = relative(realpathSync(root), file);
  return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
};

/** Resolve only through the workspace package that actually declares the dependency. */
export function declared(specifier, issuer = "heroui") {
  const manifest = JSON.parse(readFileSync(issuers[issuer], "utf8"));
  const name = packageName(specifier);
  assert.ok(
    ["dependencies", "devDependencies", "peerDependencies"].some((group) =>
      Object.hasOwn(manifest[group] ?? {}, name),
    ),
    `${name} is not declared by ${issuers[issuer]}`,
  );
  const file = realpathSync(createRequire(issuers[issuer]).resolve(specifier));
  assert.ok(
    withinRoot(file),
    `Borrowed dependency rejected: ${specifier} from ${issuers[issuer]}`,
  );
  return file;
}
export function packageRoot(name, issuer = "heroui") {
  try {
    return dirname(declared(`${name}/package.json`, issuer));
  } catch (error) {
    if (error.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") throw error;
    // Some declared tools (notably @tailwindcss/vite) keep package.json private.
    // Walk from THEIR resolved entry, never from cwd or a borrowed install.
    let directory = dirname(declared(name, issuer));
    while (withinRoot(directory)) {
      const manifest = resolve(directory, "package.json");
      if (
        existsSync(manifest) &&
        JSON.parse(readFileSync(manifest, "utf8")).name === name
      )
        return directory;
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
    throw new Error(`Cannot locate the declaring package for ${name}`);
  }
}
function exportEntry(specifier, issuer, condition) {
  const name = packageName(specifier);
  const directory = packageRoot(name, issuer);
  const manifest = JSON.parse(
    readFileSync(resolve(directory, "package.json"), "utf8"),
  );
  const subpath = `.${specifier.slice(name.length)}`;
  let entry = manifest.exports?.[subpath];
  let match;
  if (!entry)
    for (const [key, value] of Object.entries(manifest.exports ?? {})) {
      if (!key.includes("*")) continue;
      const [before, after] = key.split("*");
      if (subpath.startsWith(before) && subpath.endsWith(after)) {
        match = subpath.slice(before.length, after ? -after.length : undefined);
        entry = value;
        break;
      }
    }
  const target = typeof entry === "object" ? entry?.[condition] : undefined;
  const types =
    target ??
    (condition === "types" && subpath === "." ? manifest.types : undefined);
  assert.equal(
    typeof types,
    "string",
    `No declared ${condition} export for ${specifier}`,
  );
  return realpathSync(
    resolve(
      directory,
      match === undefined ? types : types.replaceAll("*", match),
    ),
  );
}
export function typeEntry(specifier, issuer = "heroui") {
  return exportEntry(specifier, issuer, "types");
}

export const sourcePaths = {
  "@tableweave/react/contracts": resolve(
    root,
    "packages/react/src/contracts/index.ts",
  ),
  "@tableweave/react/filters": resolve(
    root,
    "packages/react/src/filters/index.ts",
  ),
  "@tableweave/react": resolve(root, "packages/react/src/index.ts"),
};
export function sourceAliases() {
  return Object.entries(sourcePaths).map(([name, replacement]) => ({
    find: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    replacement,
  }));
}
export function runtimeAliases() {
  const aliases = [
    ...sourceAliases(),
    { find: "react", replacement: packageRoot("react") },
    { find: "react-dom", replacement: packageRoot("react-dom") },
  ];
  // Only fixture-level public imports need aliases. Do not rewrite every Aria
  // subpath into an absolute directory (which can bypass import conditions).
  for (const specifier of [
    "react-aria-components",
    "react-aria-components/I18nProvider",
    "react-aria/I18nProvider",
  ])
    aliases.push({
      find: new RegExp(`^${specifier}$`),
      replacement: exportEntry(specifier, "heroui", "import"),
    });
  for (const name of [
    "button",
    "button-group",
    "checkbox",
    "table",
    "popover",
    "label",
    "list-box",
    "pagination",
    "select",
  ])
    aliases.push({
      find: `@heroui/react/${name}`,
      replacement: declared(`@heroui/react/${name}`),
    });
  for (const specifier of ["@heroui/styles", "@heroui/styles/css"])
    aliases.push({
      find: new RegExp(`^${specifier}$`),
      replacement: declared(specifier),
    });
  // The frozen fixture CSS retains its original imports. Resolve these imports;
  // do not recreate a borrowed symlink or edit the reviewed fixture application.
  aliases.push(
    {
      find: /^(?:.*\/)?vendor-node_modules\/tailwindcss\/index\.css$/,
      replacement: declared("tailwindcss/index.css"),
    },
    {
      find: /^(?:.*\/)?vendor-node_modules\/@heroui\/styles\/dist\/index\.css$/,
      replacement: resolve(packageRoot("@heroui/styles"), "dist/index.css"),
    },
  );
  return aliases;
}
export function sourceTypePaths() {
  const paths = Object.fromEntries(
    Object.entries(sourcePaths).map(([name, path]) => [name, [path]]),
  );
  for (const name of ["@heroui/styles", "react-aria", "react-aria-components"])
    paths[name] = [typeEntry(name)];
  for (const name of ["@tanstack/react-table", "@tanstack/table-core"])
    paths[name] = [typeEntry(name, "react")];
  for (const name of ["react", "react-dom"]) {
    const directory = packageRoot(`@types/${name}`, "root");
    paths[name] = [resolve(directory, "index.d.ts")];
    paths[`${name}/*`] = [resolve(directory, "*.d.ts")];
  }
  for (const name of [
    "button",
    "button-group",
    "checkbox",
    "table",
    "popover",
    "label",
    "list-box",
    "pagination",
    "select",
  ])
    paths[`@heroui/react/${name}`] = [typeEntry(`@heroui/react/${name}`)];
  for (const name of ["react-aria", "react-aria-components"])
    paths[`${name}/*`] = [
      resolve(packageRoot(name), "dist/types/exports/*.d.ts"),
    ];
  return paths;
}
export async function sourceVite(configURL) {
  const tailwindcss = (await import(declared("@tailwindcss/vite", "storybook")))
    .default;
  return {
    root: fileURLToPath(new URL("./", configURL)),
    cacheDir: fileURLToPath(new URL("./.artifacts/vite-portable", configURL)),
    plugins: [tailwindcss()],
    esbuild: { jsx: "automatic" },
    resolve: { alias: runtimeAliases(), dedupe: ["react", "react-dom"] },
    server: {
      fs: { allow: [root] },
      hmr: false,
      watch: { ignored: ["**/.artifacts/**"] },
    },
  };
}
