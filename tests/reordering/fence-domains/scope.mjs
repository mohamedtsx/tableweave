import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/reordering/fence-domains/";
const leased = "packages/react/src/reordering-controller/admission.ts";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const bytes = await readFile(
  "/tmp/opencode/wp10-held-ui-bridge-source150.json",
);
assert.equal(
  hash(bytes),
  "9c7c0a8a0546506016d658d1cdefd15266ab8c94bbde465cfd9c2b4ea3a9692c",
);
const canonical = JSON.parse(bytes);
assert.equal(Object.keys(canonical).length, 150);
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
        "dist",
        "build",
        "test-results",
        "playwright-report",
      ].includes(entry.name) ||
      (entry.name === ".artifacts" &&
        !relative(root, directory).startsWith("tests/reordering")) ||
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
async function inputs() {
  const paths = (await walk(root))
    .filter((path) => !path.startsWith(own) && path !== leased)
    .sort();
  return Object.fromEntries(
    await Promise.all(paths.map(async (path) => [path, await measure(path)])),
  );
}
const capture = process.argv[2] === "before";
for (const [path, expected] of Object.entries(canonical)) {
  if (!capture && path === leased) continue;
  const actual = await measure(path);
  assert.equal(actual.sha256, expected.sha256, path);
  assert.equal(actual.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
const map = new URL("./before.json", import.meta.url);
const image = new URL("./preimages/admission.ts.txt", import.meta.url);
if (capture) {
  const protectedInputs = await inputs();
  await mkdir(new URL("./preimages/", import.meta.url));
  await writeFile(image, await readFile(resolve(root, leased)), { flag: "wx" });
  await writeFile(
    map,
    `${JSON.stringify({ suppliedBase: "ccede5c (no worker Git operation)", canonical150: hash(bytes), preimage: canonical[leased], protectedInputs }, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `All150 source hashes/modes matched before edits; one exact preimage and ${Object.keys(protectedInputs).length} old protected inputs captured.`,
  );
} else {
  const before = JSON.parse(await readFile(map, "utf8")),
    current = await inputs();
  const bookkeeping = (path) =>
    path.startsWith("docs/") || ["TASKS.md", "REVIEW.md"].includes(path);
  const drift = [
    ...new Set([
      ...Object.keys(current),
      ...Object.keys(before.protectedInputs),
    ]),
  ]
    .filter(bookkeeping)
    .sort()
    .flatMap((path) =>
      JSON.stringify(current[path]) ===
      JSON.stringify(before.protectedInputs[path])
        ? []
        : [
            {
              path,
              before: before.protectedInputs[path] ?? null,
              current: current[path] ?? null,
            },
          ],
    );
  if (drift.length)
    console.log(
      `Main-only documentation drift, NOT rebaselined:\n${JSON.stringify(drift, null, 2)}`,
    );
  const frozen = (data) =>
    Object.fromEntries(
      Object.entries(data).filter(([path]) => !bookkeeping(path)),
    );
  assert.deepEqual(frozen(current), frozen(before.protectedInputs));
  assert.equal(hash(await readFile(image)), canonical[leased].sha256);
  console.log(
    `All149 protected sources/modes and ${Object.keys(frozen(current)).length} non-bookkeeping old inputs unchanged; original preimage and all old candidate/fixture/map/log history preserved.`,
  );
}
