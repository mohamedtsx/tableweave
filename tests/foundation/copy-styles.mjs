import { copyFile, lstat, mkdir, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Explicit owned stylesheet roots, not a generic source/asset copier. Extend
// this list deliberately when another packet introduces component styles.
const componentRoots = [
  "filters",
  "toolbar",
  "date",
  "columns",
  "pagination",
  "details",
];

export async function copyStyles(
  source = fileURLToPath(
    new URL("../../packages/heroui/src/", import.meta.url),
  ),
  destination = fileURLToPath(
    new URL("../../packages/heroui/dist/", import.meta.url),
  ),
) {
  const copied = [];
  async function copy(relative) {
    const input = join(source, relative);
    const info = await lstat(input);
    if (!info.isFile())
      throw new Error("Stylesheets must be regular owned files");
    const output = join(destination, relative);
    await mkdir(dirname(output), { recursive: true });
    await copyFile(input, output);
    copied.push(relative);
  }
  async function directory(relative) {
    let info;
    try {
      info = await lstat(join(source, relative));
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    if (!info.isDirectory())
      throw new Error("Component styles must use owned directories");
    for (const entry of await readdir(join(source, relative), {
      withFileTypes: true,
    })) {
      if (entry.isSymbolicLink())
        throw new Error("Stylesheet source symlinks are unsupported");
      const child = join(relative, entry.name);
      if (entry.isDirectory()) await directory(child);
      else if (entry.isFile() && entry.name.endsWith(".css")) await copy(child);
    }
  }
  await copy("styles.css");
  for (const relative of componentRoots) await directory(relative);
  return copied;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await copyStyles();
