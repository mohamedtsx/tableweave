import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const own = "tests/reordering/neutral-consumer/";
const dir = path.join(root, own);
export const leased = [
  "table/types.ts",
  "table/renderer-commit.ts",
  "table/native-collection.tsx",
  "table/controlled-collection.tsx",
  "table/renderer-collection.tsx",
  "data-table/host.tsx",
  "pagination/types.ts",
  "pagination/Pagination.tsx",
  "pagination/usePaginationCorrection.ts",
  "localization/data-table.ts",
  "localization/types.ts",
].map((p) => `packages/heroui/src/${p}`);
export const added = [
  "types.ts",
  "binding.ts",
  "messages.ts",
  "host.tsx",
  "controls.tsx",
].map((p) => `packages/heroui/src/table/reordering-${p}`);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const entry = (p) => ({
  mode: fs.statSync(p).mode & 0o777,
  sha256: digest(fs.readFileSync(p)),
});
function walk(p = "", out = {}) {
  for (const d of fs.readdirSync(path.join(root, p), { withFileTypes: true })) {
    const rel = p ? `${p}/${d.name}` : d.name;
    if (["node_modules", ".git", ".repo"].includes(d.name) || `${rel}/` === own)
      continue;
    if (d.isDirectory()) walk(rel, out);
    else if (d.isFile()) out[rel] = entry(path.join(root, rel));
  }
  return out;
}
const baselinePath = path.join(dir, "before.json");
if (process.argv[2] === "capture") {
  if (fs.existsSync(baselinePath))
    throw Error("Immutable before-map already exists");
  const supplied = fs.readFileSync(
    "/tmp/opencode/wp10-b2-integrated-source150.json",
  );
  if (
    digest(supplied) !==
    "39adeb5db9bfb8d7b772d4cd67097741c3a34205a6e62edd6a9ceb77a45caaa4"
  )
    throw Error("Wrong source150 map");
  const source = JSON.parse(supplied);
  for (const [p, expected] of Object.entries(source)) {
    const actual = entry(p);
    if (
      actual.sha256 !== expected.sha256 ||
      (actual.mode & 0o111) !== (parseInt(expected.mode, 8) & 0o111)
    )
      throw Error(`Source mismatch ${p}`);
  }
  fs.mkdirSync(path.join(dir, "preimages"), { recursive: true });
  for (const p of leased)
    fs.copyFileSync(
      p,
      path.join(dir, "preimages", `${p.replaceAll("/", "__")}.preimage`),
    );
  fs.writeFileSync(path.join(dir, "source150-before.json"), supplied);
  fs.writeFileSync(baselinePath, `${JSON.stringify(walk(), null, 2)}\n`);
  console.log(
    `Captured ${Object.keys(source).length} exact source hashes/modes and ${Object.keys(JSON.parse(fs.readFileSync(baselinePath))).length} old regular inputs`,
  );
} else {
  const old = JSON.parse(fs.readFileSync(baselinePath));
  const changed = [];
  const current = walk();
  for (const [p, expected] of Object.entries(old)) {
    if (leased.includes(p)) continue;
    if (
      !fs.existsSync(p) ||
      JSON.stringify(entry(p)) !== JSON.stringify(expected)
    )
      changed.push(p);
  }
  for (const p of Object.keys(current))
    if (!(p in old) && !added.includes(p)) changed.push(`UNLEASED NEW ${p}`);
  const original = JSON.parse(
    fs.readFileSync(path.join(dir, "source150-before.json")),
  );
  if (
    digest(fs.readFileSync(path.join(dir, "source150-before.json"))) !==
    "39adeb5db9bfb8d7b772d4cd67097741c3a34205a6e62edd6a9ceb77a45caaa4"
  )
    throw Error("Immutable original source map changed");
  for (const [p, expected] of Object.entries(original)) {
    // Supplied source modes are normalized Git modes; before.json separately
    // retains exact Linux permissions (this tree starts group-writable 0664).
    if (
      old[p]?.sha256 !== expected.sha256 ||
      (old[p]?.mode & 0o111) !== (parseInt(expected.mode, 8) & 0o111)
    )
      changed.push(`INITIAL SOURCE ${p}`);
  }
  for (const p of leased) {
    const preimage = path.join(
      dir,
      "preimages",
      `${p.replaceAll("/", "__")}.preimage`,
    );
    if (digest(fs.readFileSync(preimage)) !== original[p].sha256)
      changed.push(`PREIMAGE ${p}`);
    if ((fs.statSync(preimage).mode & 0o777) !== old[p].mode)
      changed.push(`PREIMAGE MODE ${p}`);
  }
  if (changed.length)
    throw Error(`Protected old inputs changed: ${changed.join(", ")}`);
  console.log(
    `Preserved ${Object.keys(old).length - leased.length} old regular inputs, including all unleased source bodies`,
  );
}
