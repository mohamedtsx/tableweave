import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const scopes = ["core", "selection", "pagination", "columns", "collection"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function walk(path, accept = () => true) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(path, entry.name);
    if (entry.isDirectory() && entry.name !== ".artifacts")
      return walk(file, accept);
    return entry.isFile() && accept(file) ? [file] : [];
  });
}
const groups = {
  runtime: ["packages/react/src", "packages/heroui/src"].flatMap((path) =>
    walk(resolve(root, path)),
  ),
  dist: ["packages/react/dist", "packages/heroui/dist"].flatMap((path) =>
    walk(resolve(root, path)),
  ),
  fixtures: scopes.flatMap((scope) =>
    walk(
      resolve(root, `tests/controls/${scope}`),
      (file) =>
        /\.(?:tsx?|css|html)$/.test(file) &&
        !/(?:config|fingerprint|check-types|check-ssr)/.test(file),
    ),
  ),
  history: scopes.flatMap((scope) => [
    ...walk(resolve(root, `tests/controls/${scope}`), (file) =>
      /(?:\.sha256|SHA256SUMS)$/.test(file),
    ),
    ...["source-fingerprints.sha256"]
      .map((file) =>
        resolve(root, `tests/controls/${scope}/.artifacts/${file}`),
      )
      .filter(existsSync),
  ]),
};
mkdirSync(resolve(here, ".artifacts"), { recursive: true });
for (const [name, files] of Object.entries(groups)) {
  const manifest = [...new Set(files)]
    .sort()
    .map((path) => `${hash(readFileSync(path))}  ${relative(root, path)}\n`)
    .join("");
  const path = resolve(here, `portability-before.${name}.sha256`);
  if (process.argv[2] === "capture")
    writeFileSync(path, manifest, { flag: "wx" });
  else
    assert.equal(
      manifest,
      readFileSync(path, "utf8"),
      `${name} changed during the test-only portability pass`,
    );
  console.log(
    `${name}: ${files.length} files ${hash(manifest)} ${process.argv[2] === "capture" ? "captured" : "unchanged"}`,
  );
}
