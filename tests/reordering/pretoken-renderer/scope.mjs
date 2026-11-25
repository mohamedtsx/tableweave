import fs from "node:fs";
import { createHash } from "node:crypto";
const own = "tests/reordering/pretoken-renderer";
export const leased = [
  "table/types.ts",
  "table/renderer-commit.ts",
  "table/native-collection.tsx",
  "table/controlled-collection.tsx",
  "table/renderer-collection.tsx",
  "table/reordering-types.ts",
  "table/reordering-binding.ts",
  "table/reordering-messages.ts",
  "table/reordering-host.tsx",
  "table/reordering-controls.tsx",
  "data-table/host.tsx",
  "pagination/types.ts",
  "pagination/Pagination.tsx",
  "pagination/usePaginationCorrection.ts",
  "localization/data-table.ts",
  "localization/types.ts",
  "filters/criteria-commit-core.ts",
  "table/native-resource-lifetime.ts",
].map((p) => `packages/heroui/src/${p}`);
export const added = ["packages/heroui/src/table/reordering-operation.ts"];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const entry = (file) => ({
  mode: fs.statSync(file).mode & 0o777,
  sha256: digest(fs.readFileSync(file)),
});
function walk(directory = "", result = {}) {
  for (const item of fs.readdirSync(directory || ".", {
    withFileTypes: true,
  })) {
    const file = directory ? `${directory}/${item.name}` : item.name;
    if ([".git", "node_modules", ".repo"].includes(item.name) || file === own)
      continue;
    if (item.isDirectory()) walk(file, result);
    else if (item.isFile()) result[file] = entry(file);
  }
  return result;
}
const metadata = (file) =>
  ["TASKS.md", "REVIEW.md", "PROJECT.md", "AGENTS.md", "README.md"].includes(
    file,
  ) ||
  file.startsWith("docs/") ||
  file.startsWith("product/");
if (process.argv[2] === "capture") {
  if (fs.existsSync(`${own}/before.json`))
    throw Error("Never replace original before map");
  const bytes = fs.readFileSync(
    "/tmp/opencode/wp10-c1a-neutral-integrated-source155.json",
  );
  if (
    digest(bytes) !==
    "319505b86c687ead5c471d3c18703aa1b442dcc6429369d9ed19d1a1ee4be807"
  )
    throw Error("Wrong source155 baseline");
  const source = JSON.parse(bytes);
  for (const [file, expected] of Object.entries(source))
    if (
      entry(file).sha256 !== expected.sha256 ||
      (entry(file).mode & 0o111) !== (parseInt(expected.mode, 8) & 0o111)
    )
      throw Error(`Source mismatch ${file}`);
  fs.mkdirSync(`${own}/preimages`, { recursive: true });
  for (const file of leased)
    fs.copyFileSync(
      file,
      `${own}/preimages/${file.replaceAll("/", "__")}.preimage`,
    );
  fs.writeFileSync(`${own}/source155-before.json`, bytes);
  const before = walk();
  fs.writeFileSync(
    `${own}/before.json`,
    `${JSON.stringify(before, null, 2)}\n`,
  );
  console.log(
    `Captured exact155 sources,18 preimages and${Object.keys(before).length} old regular inputs before edits`,
  );
} else {
  const before = JSON.parse(fs.readFileSync(`${own}/before.json`)),
    now = walk(),
    drift = [],
    forbidden = [];
  for (const [file, expected] of Object.entries(before)) {
    if (leased.includes(file)) continue;
    if (!now[file] || JSON.stringify(now[file]) !== JSON.stringify(expected))
      (metadata(file) ? drift : forbidden).push(file);
  }
  for (const file of Object.keys(now))
    if (!(file in before) && !added.includes(file))
      (metadata(file) ? drift : forbidden).push(`NEW ${file}`);
  const original = JSON.parse(fs.readFileSync(`${own}/source155-before.json`));
  for (const file of leased) {
    if (entry(file).mode !== before[file].mode)
      forbidden.push(`LEASE MODE ${file}`);
    const actual = entry(
      `${own}/preimages/${file.replaceAll("/", "__")}.preimage`,
    );
    if (
      actual.sha256 !== original[file].sha256 ||
      actual.mode !== before[file].mode
    )
      forbidden.push(`PREIMAGE ${file}`);
  }
  if (drift.length)
    console.log(`Main-owned metadata drift (not rebased): ${drift.join(", ")}`);
  if (forbidden.length)
    throw Error(`Frozen inputs changed: ${forbidden.join(", ")}`);
  console.log(
    `Preserved137 unleased source hashes/modes and${Object.keys(before).length - leased.length} old nonleased inputs (metadata drift separately reported)`,
  );
}
