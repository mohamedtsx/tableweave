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
const changed = [
  "packages/heroui/src/columns/column-chooser.tsx",
  "packages/heroui/src/sorting/sorting.tsx",
];
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
const line = (file) => `${hash(readFileSync(file))}  ${relative(root, file)}\n`;
if (process.argv[2] === "capture") {
  const groups = {
    runtime: ["packages/react/src", "packages/heroui/src"].flatMap((path) =>
      walk(resolve(root, path)),
    ),
    dist: ["packages/react/dist", "packages/heroui/dist"].flatMap((path) =>
      walk(resolve(root, path)),
    ),
    history: [
      "core",
      "selection",
      "pagination",
      "columns",
      "collection",
      "harness",
    ].flatMap((scope) =>
      walk(resolve(root, `tests/controls/${scope}`), (file) =>
        /(?:\.sha256|SHA256SUMS)$/.test(file),
      ),
    ),
    api: [
      "columns/index",
      "columns/types",
      "columns/column-chooser",
      "sorting/index",
      "sorting/types",
      "sorting/sorting",
    ].map((path) =>
      resolve(here, `.artifacts/declarations/packages/heroui/src/${path}.d.ts`),
    ),
  };
  // Capture all groups before creating new snapshots, excluding artifacts except
  // the six explicitly selected prior public declarations. Never overwrite history.
  for (const [name, files] of Object.entries(groups)) {
    const manifest = files.sort().map(line).join("");
    writeFileSync(resolve(here, `rapid-before.${name}.sha256`), manifest, {
      flag: "wx",
    });
    console.log(`${name}: ${files.length} files ${hash(manifest)} captured`);
  }
} else if (process.argv[2] === "archive-failure") {
  const archive = resolve(here, ".artifacts/rapid-before");
  for (const path of [
    ...changed,
    "tests/controls/columns/rapid-popover.spec.ts",
    "tests/controls/columns/playwright.config.ts",
  ]) {
    const target = resolve(archive, "inputs", path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(resolve(root, path)), { flag: "wx" });
  }
  writeFileSync(
    resolve(archive, "report.json"),
    readFileSync(resolve(here, ".artifacts/results.json")),
    { flag: "wx" },
  );
  const files = walk(archive);
  const manifest = files.sort().map(line).join("");
  writeFileSync(resolve(here, "rapid-before.failure.sha256"), manifest, {
    flag: "wx",
  });
  console.log(
    `Unchanged-source failure archive: ${files.length} files ${hash(manifest)}`,
  );
} else {
  const observed = [];
  for (const name of ["runtime", "dist", "history", "api"]) {
    const manifest = readFileSync(
      resolve(here, `rapid-before.${name}.sha256`),
      "utf8",
    );
    for (const entry of manifest.trimEnd().split("\n")) {
      const path = entry.slice(66);
      if (line(resolve(root, path)).trimEnd() !== entry) {
        assert.equal(name, "runtime", `${name} input changed: ${path}`);
        observed.push(path);
      }
    }
    console.log(`${name}: prior manifest ${hash(manifest)} checked`);
    if (name === "runtime" || name === "dist") {
      const current = ["packages/react", "packages/heroui"]
        .flatMap((path) =>
          walk(resolve(root, path, name === "runtime" ? "src" : "dist")),
        )
        .sort();
      const priorPaths = manifest
        .trimEnd()
        .split("\n")
        .map((entry) => entry.slice(66))
        .sort();
      assert.deepEqual(
        current.map((file) => relative(root, file)).sort(),
        priorPaths,
        `${name} file inventory changed`,
      );
      if (name === "runtime") {
        const updated = current.map(line).join("");
        writeFileSync(resolve(here, "rapid-after.runtime.sha256"), updated);
        console.log(
          `Current source manifest: ${current.length} files ${hash(updated)}`,
        );
      }
    }
  }
  assert.deepEqual(
    observed.sort(),
    [...changed].sort(),
    "Only the two allocated source files may change",
  );
  console.log(
    "Only two allocated source deltas; shared dist, historical manifests and six public declaration files unchanged",
  );
  const files = [
    ...changed.map((path) => resolve(root, path)),
    ...walk(here, (path) => /\.(?:ts|tsx|mjs)$/.test(path)),
  ];
  const manifest = files.sort().map(line).join("");
  writeFileSync(resolve(here, "rapid-correction.sha256"), manifest);
  console.log(
    `New correction manifest: ${files.length} inputs ${hash(manifest)}`,
  );
}
