import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = [
  "apps/examples/shared/",
  "apps/storybook/src/workbench/",
  "tests/workbench/wp11-catalog/",
];
const css = "apps/storybook/src/styles.css";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalBytes = await readFile(
  "/tmp/opencode/wp10-move-reason-integrated-source155.json",
);
assert.equal(
  hash(canonicalBytes),
  "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837",
);
const canonical = JSON.parse(canonicalBytes);
assert.equal(Object.keys(canonical).length, 155);
async function measure(path) {
  return {
    sha256: hash(await readFile(resolve(root, path))),
    mode: (await stat(resolve(root, path))).mode & 0o777,
  };
}
async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    // Dependency stores, Git/reference metadata and credential-shaped inputs are not read.
    if (
      ["node_modules", ".git", ".repo"].includes(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name === ".npmrc"
    )
      continue;
    const path = resolve(directory, entry.name),
      rel = relative(root, path);
    if (own.some((prefix) => `${rel}/` === prefix)) continue;
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (entry.isFile() && rel !== css) paths.push(rel);
  }
  return paths;
}
const capture = process.argv[2] === "before";
for (const [path, expected] of Object.entries(canonical)) {
  const actual = await measure(path);
  assert.equal(actual.sha256, expected.sha256, path);
  assert.equal(actual.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
const current = Object.fromEntries(
  await Promise.all(
    (await walk(root)).sort().map(async (path) => [path, await measure(path)]),
  ),
);
const map = new URL("./before.json", import.meta.url);
if (capture) {
  await mkdir(new URL("./preimages/", import.meta.url));
  await writeFile(
    new URL("./preimages/styles.css.txt", import.meta.url),
    await readFile(resolve(root, css)),
    { flag: "wx" },
  );
  await writeFile(
    map,
    `${JSON.stringify({ suppliedBase: "d6a53f6 (no worker Git inspection)", canonical155: hash(canonicalBytes), source155: canonical, styles: await measure(css), protectedInputs: current }, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `Before edits: all155 source hashes/modes match; ${Object.keys(current).length} old regular inputs captured; exact sole existing CSS preimage saved.`,
  );
} else {
  const before = JSON.parse(await readFile(map, "utf8"));
  const bookkeeping = (path) =>
    path.startsWith("docs/") || ["TASKS.md", "REVIEW.md"].includes(path);
  const drift = [
    ...new Set([
      ...Object.keys(current),
      ...Object.keys(before.protectedInputs),
    ]),
  ]
    .filter(bookkeeping)
    .filter(
      (path) =>
        JSON.stringify(current[path]) !==
        JSON.stringify(before.protectedInputs[path]),
    );
  console.log(
    `Main-only metadata drift (not rebaselined): ${JSON.stringify(drift)}`,
  );
  const frozen = (value) =>
    Object.fromEntries(
      Object.entries(value).filter(([path]) => !bookkeeping(path)),
    );
  assert.deepEqual(frozen(current), frozen(before.protectedInputs));
  const image = await readFile(
    new URL("./preimages/styles.css.txt", import.meta.url),
    "utf8",
  );
  assert.equal(hash(image), before.styles.sha256);
  assert.equal(
    await readFile(resolve(root, css), "utf8"),
    `${image}\n@source "../../examples/shared";\n`,
  );
  assert.equal((await measure(css)).mode, before.styles.mode);
  console.log(
    `All155 library sources and ${Object.keys(frozen(current)).length} old non-bookkeeping inputs/modes unchanged; CSS is the exact additive scanner only.`,
  );
}
