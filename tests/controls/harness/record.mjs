import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { root } from "./resolve.mjs";

const files = [];
for (const scope of [
  "core",
  "selection",
  "pagination",
  "columns",
  "collection",
  "harness",
]) {
  const directory = resolve(root, `tests/controls/${scope}`);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (
      scope === "harness"
        ? /\.(?:mjs|mts|json)$/.test(entry.name)
        : /(?:config|check-types|check-ssr|fingerprints)/.test(entry.name)
    )
      files.push(resolve(directory, entry.name));
  }
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const manifest = files
  .sort()
  .map((path) => `${hash(readFileSync(path))}  ${relative(root, path)}\n`)
  .join("");
writeFileSync(
  resolve(root, "tests/controls/harness/portability-layer.sha256"),
  manifest,
);
console.log(
  `New portability layer: ${files.length} files ${hash(manifest)} (historical manifests untouched)`,
);
