import assert from "node:assert/strict";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const startPatches = {
  "@tanstack/start-server-core@1.169.40":
    "patches/@tanstack__start-server-core@1.169.40.patch",
  "@tanstack/start-plugin-core@1.171.50":
    "patches/@tanstack__start-plugin-core@1.171.50.patch",
};
export const serverDependencies = {
  "@standard-schema/spec": "1.1.0",
  "cookie-es": "3.1.1",
};

// pnpm root configuration is not inherited through a library archive. Stage only
// the exact independently reviewed app-required repair, never UI patches/waivers.
export async function stageStartCompatibility(root, target) {
  const workspace = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");
  await mkdir(join(target, "patches"), { recursive: true });
  for (const [name, path] of Object.entries(startPatches)) {
    assert(workspace.includes(`'${name}': ${path}`));
    await cp(join(root, path), join(target, path));
  }
  for (const [name, version] of Object.entries(serverDependencies))
    assert(
      workspace.includes(
        `${name.includes("@") ? `'${name}'` : name}: '${version}'`,
      ),
    );
  await cp(
    join(root, "patches/LICENSE-TANSTACK-MIT"),
    join(target, "patches/LICENSE-TANSTACK-MIT"),
  );
  await writeFile(
    join(target, "patches/README.txt"),
    "TanStack material Copyright (c) 2021-present Tanner Linsley, MIT; see LICENSE-TANSTACK-MIT.\n" +
      "Tableweave compatibility modifications: restore exact omitted session algorithm type; use genuine public Router Vite type entry. Runtime files unchanged.\n",
  );
  await writeFile(
    join(target, "pnpm-workspace.yaml"),
    [
      "packages:",
      '  - "apps/*"',
      "onlyBuiltDependencies:",
      "  - esbuild",
      "patchedDependencies:",
      ...Object.entries(startPatches).map(
        ([name, path]) => `  '${name}': ${path}`,
      ),
      "packageExtensions:",
      "  '@tanstack/start-server-core@1.169.40':",
      "    dependencies:",
      ...Object.entries(serverDependencies).map(
        ([name, version]) => `      '${name}': '${version}'`,
      ),
      "",
    ].join("\n"),
  );
}
