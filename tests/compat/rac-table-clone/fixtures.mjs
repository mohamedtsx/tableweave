import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const assetsRoot = fileURLToPath(
  new URL("../../../packages/heroui/compat/rac-table-clone/", import.meta.url),
);
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function fixture({ realDescriptor = false } = {}) {
  const parent = join(own, ".artifacts", "fixtures");
  mkdirSync(parent, { recursive: true });
  const temp = mkdtempSync(join(parent, "case-"));
  const project = join(temp, "project");
  const assets = join(temp, "assets");
  const vendor = join(
    project,
    "node_modules/.pnpm/react-aria-components@1.22.1/node_modules/react-aria-components",
  );
  mkdirSync(vendor, { recursive: true });
  cpSync(assetsRoot, assets, { recursive: true });
  writeFileSync(
    join(project, "package.json"),
    JSON.stringify({
      name: "synthetic-profile-consumer",
      private: true,
      dependencies: { "react-aria-components": "1.22.1" },
    }),
  );
  writeFileSync(
    join(vendor, "package.json"),
    JSON.stringify({
      name: "react-aria-components",
      version: "1.22.1",
      exports: { "./package.json": "./package.json" },
    }),
  );
  symlinkSync(
    ".pnpm/react-aria-components@1.22.1/node_modules/react-aria-components",
    join(project, "node_modules/react-aria-components"),
    "dir",
  );
  const descriptor = JSON.parse(
    readFileSync(join(assets, "profile.json"), "utf8"),
  );
  if (!realDescriptor) {
    // Deliberate coherent descriptor/runtime test doubles. These are NOT proof
    // that these bytes come from the registry or are the patch's real output.
    for (const file of descriptor.files) {
      const bytes = Buffer.from(
        `throw new Error("VENDOR MUST NOT EXECUTE: ${file.format}");\n`,
      );
      const path = join(vendor, file.path);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, bytes);
      file.afterSha256 = hash(bytes);
    }
    writeFileSync(join(assets, "profile.json"), JSON.stringify(descriptor));
  }
  return {
    temp,
    project,
    assets,
    vendor,
    descriptor,
    cleanup: () => rmSync(temp, { recursive: true, force: true }),
  };
}
export function run(f, args = [f.project], env = {}) {
  return spawnSync(process.execPath, [join(f.assets, "verify.mjs"), ...args], {
    encoding: "utf8",
    env: { ...process.env, NODE_OPTIONS: "", NODE_PATH: "", ...env },
  });
}
export function descriptor(f, mutate) {
  const path = join(f.assets, "profile.json");
  const value = JSON.parse(readFileSync(path, "utf8"));
  mutate(value);
  writeFileSync(path, JSON.stringify(value));
}
export function snapshot(base) {
  const result = {};
  function visit(path, prefix) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const key = `${prefix}${entry.name}`;
      const child = join(path, entry.name);
      if (entry.isSymbolicLink()) result[key] = `link:${readlinkSync(child)}`;
      else if (entry.isDirectory()) visit(child, `${key}/`);
      else result[key] = hash(readFileSync(child));
    }
  }
  visit(base, "");
  return result;
}
