import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/reordering/admission/";
const source = "packages/react/src/reordering-controller/";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const bytes = await readFile(
  "/tmp/opencode/wp10-before-core-entry-source145.json",
);
assert.equal(
  hash(bytes),
  "31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe",
);
const canonical = JSON.parse(bytes);
assert.equal(Object.keys(canonical).length, 145);
async function measure(path) {
  return {
    sha256: hash(await readFile(resolve(root, path))),
    mode: (await stat(resolve(root, path))).mode & 0o777,
  };
}
async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      [
        "node_modules",
        ".git",
        ".repo",
        ".artifacts",
        "dist",
        "build",
        "test-results",
        "playwright-report",
      ].includes(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name === ".npmrc"
    )
      continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (entry.isFile()) paths.push(relative(root, path));
  }
  return paths;
}
async function protectedFiles() {
  const paths = (await walk(root))
    .filter(
      (path) =>
        !path.startsWith(own) &&
        !path.startsWith(source) &&
        !["TASKS.md", "REVIEW.md"].includes(path) &&
        !path.startsWith("docs/"),
    )
    .sort();
  return Object.fromEntries(
    await Promise.all(paths.map(async (path) => [path, await measure(path)])),
  );
}
for (const [path, expected] of Object.entries(canonical)) {
  const current = await measure(path);
  assert.equal(current.sha256, expected.sha256, path);
  assert.equal(current.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
const output = new URL("./before.json", import.meta.url);
if (process.argv[2] === "before") {
  const protectedInputs = await protectedFiles();
  await writeFile(
    output,
    `${JSON.stringify(
      {
        suppliedRevision: "848c94b (not Git-reverified)",
        canonicalSha256: hash(bytes),
        bookkeepingExclusions: ["docs/**", "TASKS.md", "REVIEW.md"],
        protectedInputs,
      },
      null,
      2,
    )}\n`,
    { flag: "wx" },
  );
  console.log(
    `All145 source hashes/modes verified before additions; ${Object.keys(protectedInputs).length} protected inputs captured. Main docs/ledger bookkeeping excluded; worker may not edit them.`,
  );
} else {
  const before = JSON.parse(await readFile(output, "utf8"));
  assert.deepEqual(await protectedFiles(), before.protectedInputs);
  console.log(
    `All145 original sources/modes and ${Object.keys(before.protectedInputs).length} protected files unchanged.`,
  );
}
