import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const paths = [];
function visit(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== ".artifacts")
      visit(resolve(path, entry.name));
    else if (entry.isFile() && /\.(?:ts|tsx|css|mjs|html)$/.test(entry.name))
      paths.push(resolve(path, entry.name));
  }
}
for (const path of [
  "packages/react/src",
  "packages/heroui/src/columns",
  "packages/heroui/src/sorting",
  "tests/controls/columns",
])
  visit(resolve(root, path));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const manifest = paths
  .sort()
  .map((path) => `${hash(readFileSync(path))}  ${relative(root, path)}\n`)
  .join("");
mkdirSync(resolve(here, ".artifacts"), { recursive: true });
// Preserve the historical source review manifest; this is a new harness layer.
writeFileSync(
  resolve(here, ".artifacts/source-fingerprints.portability.sha256"),
  manifest,
);
console.log(
  `${paths.length} source/fixture files; manifest SHA-256 ${hash(manifest)}`,
);
