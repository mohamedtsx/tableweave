import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/reordering/ui-bridge/";
const leased = [
  "packages/react/src/reordering-controller/admission.ts",
  "packages/react/src/reordering-controller/types.ts",
  "packages/react/src/reordering-controller/index.ts",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const bytes = await readFile(
  "/tmp/opencode/wp10-integrated-prerequisites-source150.json",
);
assert.equal(
  hash(bytes),
  "80ce38f6479ac13c80e925d519b9b6619921680513c15fdff0f0f4e4657bf8e7",
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
    .filter((path) => !path.startsWith(own) && !leased.includes(path))
    .sort();
  return Object.fromEntries(
    await Promise.all(paths.map(async (path) => [path, await measure(path)])),
  );
}
const capture = process.argv[2] === "before";
for (const [path, expected] of Object.entries(canonical)) {
  if (!capture && leased.includes(path)) continue;
  const current = await measure(path);
  assert.equal(current.sha256, expected.sha256, path);
  assert.equal(current.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
const map = new URL("./before.json", import.meta.url);
const image = (path) =>
  new URL(`./preimages/${path.replaceAll("/", "__")}.txt`, import.meta.url);
if (capture) {
  const protectedInputs = await inputs();
  await mkdir(new URL("./preimages/", import.meta.url));
  for (const path of leased)
    await writeFile(image(path), await readFile(resolve(root, path)), {
      flag: "wx",
    });
  await writeFile(
    map,
    `${JSON.stringify(
      {
        suppliedRevision: "6f157bf (no worker Git operation)",
        canonical150: hash(bytes),
        preimages: Object.fromEntries(
          leased.map((path) => [path, canonical[path]]),
        ),
        protectedInputs,
      },
      null,
      2,
    )}\n`,
    { flag: "wx" },
  );
  console.log(
    `Before edits: all150 source hashes/modes match; three exact preimages and ${Object.keys(protectedInputs).length} protected inputs captured.`,
  );
} else {
  const before = JSON.parse(await readFile(map, "utf8"));
  const current = await inputs();
  const bookkeeping = (path) =>
    path.startsWith("docs/") || ["TASKS.md", "REVIEW.md"].includes(path);
  const differences = [
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
  if (differences.length)
    console.log(
      `External main-only bookkeeping drift, NOT rebaselined:\n${JSON.stringify(differences, null, 2)}`,
    );
  const frozen = (data) =>
    Object.fromEntries(
      Object.entries(data).filter(([path]) => !bookkeeping(path)),
    );
  assert.deepEqual(frozen(current), frozen(before.protectedInputs));
  for (const path of leased)
    assert.equal(
      hash(await readFile(image(path))),
      canonical[path].sha256,
      path,
    );
  console.log(
    `All147 frozen production sources/modes and ${Object.keys(frozen(before.protectedInputs)).length} old non-bookkeeping inputs unchanged; three original preimages preserved. Historical maps/logs/fixtures untouched.`,
  );
}
