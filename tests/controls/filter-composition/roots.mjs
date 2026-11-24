import { createHash } from "node:crypto";
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const workspace = fileURLToPath(new URL("../../../", import.meta.url));
export const own = fileURLToPath(new URL("./", import.meta.url));
export const appPackage = join(workspace, "apps/storybook/package.json");
export const appRequire = createRequire(appPackage);
export const rootRequire = createRequire(join(workspace, "package.json"));
export function confined(path) {
  const actual = realpathSync(path);
  if (!actual.startsWith(`${realpathSync(workspace)}${sep}`))
    throw new Error(`External dependency/output refused: ${path}`);
  return actual;
}
export function publicEntry(name, subpath = ".", kind = "import") {
  const directory = join(workspace, "packages", name);
  const manifest = JSON.parse(
    readFileSync(join(directory, "package.json"), "utf8"),
  );
  const entry = manifest.exports[subpath];
  const relative = typeof entry === "string" ? entry : entry?.[kind];
  if (typeof relative !== "string" || !relative.startsWith("./dist/"))
    throw new Error(`Missing actual public ${name} ${subpath} ${kind} export`);
  return confined(join(directory, relative));
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
      else throw new Error(`Unexpected source/build entry: ${path}`);
    }
  }
  for (const name of ["react", "heroui"]) {
    publicEntry(name);
    visit(join(workspace, "packages", name, "src"));
    visit(join(workspace, "packages", name, "dist"));
  }
  return Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
}
