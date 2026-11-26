import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(appRoot, "../..");

// Runtime export resolution belongs to this declaring app. These are exact
// public specifiers, not package-source aliases or a fallback output generation.
const entries = [
  "@tableweave/react",
  "@tableweave/react/contracts",
  "@tableweave/react/filters",
  "@tableweave/react/reordering",
  "@tableweave/react/reordering-controller",
  "@tableweave/heroui",
  "@tableweave/heroui/styles.css",
];

/** @satisfies {import("next").NextConfig} */
const config = {
  turbopack: {
    root: repositoryRoot,
    resolveAlias: Object.fromEntries(
      entries.map((specifier) => [
        specifier,
        fileURLToPath(import.meta.resolve(specifier)),
      ]),
    ),
  },
  typescript: { ignoreBuildErrors: false },
};

export default config;
