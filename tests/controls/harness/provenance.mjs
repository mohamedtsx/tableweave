import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "vite";
import {
  declared,
  packageRoot,
  root,
  sourceAliases,
  sourcePaths,
} from "./resolve.mjs";

const dependencies = [];
for (const [name, issuer] of [
  ["react", "heroui"],
  ["react-dom", "heroui"],
  ["@heroui/react", "heroui"],
  ["@heroui/styles", "heroui"],
  ["react-aria", "heroui"],
  ["react-aria-components", "heroui"],
  ["tailwindcss", "heroui"],
  ["@tailwindcss/vite", "storybook"],
  ["@tanstack/react-table", "react"],
  ["@tanstack/table-core", "react"],
  ["@types/react", "root"],
  ["@types/react-dom", "root"],
  ["typescript", "root"],
  ["typescript-5-9", "root"],
]) {
  const directory = packageRoot(name, issuer);
  dependencies.push({
    name,
    issuer,
    directory,
    version: JSON.parse(
      readFileSync(resolve(directory, "package.json"), "utf8"),
    ).version,
  });
}
// SSR keeps dependency externalization native to Node. Browser-only directory
// aliases must not turn React's CJS runtime into an inlined SSR ESM module.
const server = await createServer({
  root,
  configFile: false,
  cacheDir: resolve(root, "tests/controls/harness/.artifacts/provenance-vite"),
  resolve: { alias: sourceAliases() },
  server: {
    middlewareMode: true,
    hmr: false,
    watch: { ignored: ["**/.artifacts/**"] },
  },
  optimizeDeps: { noDiscovery: true },
});
try {
  const bare = await server.ssrLoadModule("@tableweave/react");
  const direct = await server.ssrLoadModule(
    resolve(root, "packages/react/src/presentation/index.ts"),
  );
  assert.equal(bare.createControlsAuthority, direct.createControlsAuthority);
  assert.equal(
    bare.getControlsAuthorityOwner,
    direct.getControlsAuthorityOwner,
  );
  const resolved = await server.pluginContainer.resolveId("@tableweave/react");
  assert.equal(resolved?.id, sourcePaths["@tableweave/react"]);
  const viteRequire = (await import("node:module")).createRequire(
    declared("vite", "root"),
  );
  dependencies.push({
    name: "esbuild",
    issuer: "root-declared vite dependency",
    file: viteRequire.resolve("esbuild"),
  });
  const output = resolve(
    root,
    "tests/controls/harness/.artifacts/provenance.json",
  );
  mkdirSync(resolve(root, "tests/controls/harness/.artifacts"), {
    recursive: true,
  });
  writeFileSync(
    output,
    JSON.stringify(
      {
        dependencies,
        sourceIndex: resolved.id,
        identicalSourceFactoryAndOwnerHelper: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "Declaring-package dependency provenance and exact bare/relative source factory + owner helper identity passed (no listener/port)",
  );
} finally {
  await server.close();
}
