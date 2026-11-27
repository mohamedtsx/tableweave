import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const workspace = fileURLToPath(new URL("../../../", import.meta.url));
export const own = fileURLToPath(new URL("./", import.meta.url));
export const appRequire = createRequire(
  join(workspace, "apps/storybook/package.json"),
);
export const rootRequire = createRequire(join(workspace, "package.json"));
export function publicEntry(name, subpath = ".", kind = "import") {
  const packageRoot = join(workspace, "packages", name);
  const manifest = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8"),
  );
  const entry = manifest.exports[subpath];
  const relative = typeof entry === "string" ? entry : entry?.[kind];
  if (typeof relative !== "string" || !relative.startsWith("./dist/"))
    throw new Error(`No real emitted ${name} ${subpath} ${kind} export`);
  const path = join(packageRoot, relative);
  if (!existsSync(path))
    throw new Error(`Main-provided public build is missing: ${path}`);
  return realpathSync(path);
}
export function vendorRoot(requester, name) {
  return dirname(requester.resolve(`${name}/package.json`));
}
export function rootDigests() {
  const entries = {};
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile())
        entries[path.slice(workspace.length)] = createHash("sha256")
          .update(readFileSync(path))
          .digest("hex");
      else throw new Error(`Unexpected public build entry: ${path}`);
    }
  }
  publicEntry("react");
  publicEntry("heroui");
  publicEntry("heroui", "./styles.css");
  visit(join(workspace, "packages/react/dist"));
  visit(join(workspace, "packages/heroui/dist"));
  return Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
}
