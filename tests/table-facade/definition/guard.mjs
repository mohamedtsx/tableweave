import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = fileURLToPath(new URL("./", import.meta.url));
const ignored = new Set([".git", ".repo", "node_modules", ".artifacts"]);
const owned = (path) =>
  path.startsWith("tests/table-facade/definition/") ||
  path === "packages/react/src/table/types.ts" ||
  path === "packages/react/src/table/definition.ts";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const text = (value) => `${JSON.stringify(value, null, 2)}\n`;
function inventory() {
  const entries = {};
  function walk(directory) {
    for (const name of readdirSync(directory).sort()) {
      if (ignored.has(name)) continue;
      const path = join(directory, name);
      const relative = path.slice(root.length);
      if (owned(relative)) continue;
      const info = lstatSync(path);
      if (info.isDirectory()) walk(path);
      else if (info.isFile())
        entries[relative] = {
          mode: info.mode & 0o777,
          sha256: sha(readFileSync(path)),
        };
      else if (info.isSymbolicLink())
        entries[relative] = { link: readlinkSync(path) };
      else throw new Error("Unexpected protected entry");
    }
  }
  walk(root);
  return Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
}
const before = join(own, "protected-before.json");
const entries = inventory();
if (process.argv.includes("--before")) {
  assert(!existsSync(before), "Never rebase the protected before map");
  writeFileSync(before, text(entries), { flag: "wx" });
} else {
  assert.deepEqual(entries, JSON.parse(readFileSync(before, "utf8")));
  writeFileSync(join(own, "protected-after.json"), text(entries));
}
const sources = Object.fromEntries(
  Object.entries(entries).filter(([path]) =>
    /^packages\/(?:react|heroui)\/src\//.test(path),
  ),
);
const report = {
  protectedCount: Object.keys(entries).length,
  protectedSha256: sha(text(entries)),
  protectedSourceCount: Object.keys(sources).length,
  protectedSourceSha256: sha(text(sources)),
  scope:
    "relative path -> permission mode/raw-byte SHA; excluded Git/.repo/node_modules/.artifacts and the exact P1 lease",
};
if (!process.argv.includes("--before")) {
  const implementation = {};
  function add(path) {
    const info = lstatSync(path);
    const relative = path.slice(root.length);
    if (info.isDirectory()) {
      for (const name of readdirSync(path).sort())
        if (name !== ".artifacts") add(join(path, name));
    } else if (info.isFile())
      implementation[relative] = {
        mode: info.mode & 0o777,
        sha256: sha(readFileSync(path)),
      };
    else throw new Error("Nonregular P1 implementation entry");
  }
  add(own);
  add(join(root, "packages/react/src/table/types.ts"));
  add(join(root, "packages/react/src/table/definition.ts"));
  const sorted = Object.fromEntries(
    Object.entries(implementation).sort(([a], [b]) => a.localeCompare(b)),
  );
  mkdirSync(join(own, ".artifacts"), { recursive: true });
  writeFileSync(join(own, ".artifacts/implementation-map.json"), text(sorted));
  report.implementationCount = Object.keys(sorted).length;
  report.implementationSha256 = sha(text(sorted));
}
console.log(JSON.stringify(report, null, 2));
