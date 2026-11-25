import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/reordering/unpaged-extent/";
const leased = [
  "packages/react/src/reordering/types.ts",
  "packages/react/src/reordering/capture.ts",
  "packages/react/src/reordering-controller/admission.ts",
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalBytes = await readFile(
  "/tmp/opencode/wp10-after-held-admission-source149.json",
);
assert.equal(
  sha256(canonicalBytes),
  "c49ff0b5a5ffae020fbdef637a037fcd5ccf038b5831a9a62fa81876469f6689",
);
const canonical = JSON.parse(canonicalBytes);
assert.equal(Object.keys(canonical).length, 149);
async function measure(path) {
  return {
    sha256: sha256(await readFile(resolve(root, path))),
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
async function protectedFiles() {
  const paths = (await walk(root))
    .filter((path) => !path.startsWith(own) && !leased.includes(path))
    .sort();
  return Object.fromEntries(
    await Promise.all(paths.map(async (path) => [path, await measure(path)])),
  );
}
const before = process.argv[2] === "before";
for (const [path, expected] of Object.entries(canonical)) {
  if (!before && leased.includes(path)) continue;
  const current = await measure(path);
  assert.equal(current.sha256, expected.sha256, path);
  assert.equal(current.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
const mapPath = new URL("./before.json", import.meta.url);
if (before) {
  const protectedInputs = await protectedFiles();
  await mkdir(new URL("./preimages/", import.meta.url));
  for (const path of leased) {
    await writeFile(
      new URL(`./preimages/${path.replaceAll("/", "__")}.txt`, import.meta.url),
      await readFile(resolve(root, path)),
      { flag: "wx" },
    );
  }
  await writeFile(
    mapPath,
    `${JSON.stringify(
      {
        suppliedRevision: "e9d1721 (no worker Git operation)",
        canonical149: sha256(canonicalBytes),
        leasedPreimages: Object.fromEntries(
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
    `Before edits: all149 sources/modes match; three byte-exact preimages saved; ${Object.keys(protectedInputs).length} existing protected inputs captured (including historical reorder light logs/maps and docs).`,
  );
} else {
  const baseline = JSON.parse(await readFile(mapPath, "utf8"));
  const current = await protectedFiles();
  const mainBookkeeping = (path) =>
    path.startsWith("docs/") || ["TASKS.md", "REVIEW.md"].includes(path);
  const bookkeeping = [
    ...new Set([
      ...Object.keys(current),
      ...Object.keys(baseline.protectedInputs),
    ]),
  ]
    .filter(mainBookkeeping)
    .sort()
    .flatMap((path) =>
      JSON.stringify(current[path]) ===
      JSON.stringify(baseline.protectedInputs[path])
        ? []
        : [
            {
              path,
              before: baseline.protectedInputs[path] ?? null,
              current: current[path] ?? null,
            },
          ],
    );
  if (bookkeeping.length)
    console.log(
      `External main-owned bookkeeping drift (worker did not edit; original before-map retained):\n${JSON.stringify(bookkeeping, null, 2)}`,
    );
  const protectedOnly = (map) =>
    Object.fromEntries(
      Object.entries(map).filter(([path]) => !mainBookkeeping(path)),
    );
  assert.deepEqual(
    protectedOnly(current),
    protectedOnly(baseline.protectedInputs),
  );
  for (const path of leased) {
    assert.equal(
      sha256(
        await readFile(
          new URL(
            `./preimages/${path.replaceAll("/", "__")}.txt`,
            import.meta.url,
          ),
        ),
      ),
      canonical[path].sha256,
    );
  }
  console.log(
    `Current lane: all146 unleased production sources/modes and ${Object.keys(protectedOnly(baseline.protectedInputs)).length} non-bookkeeping old inputs unchanged; original three preimages preserved. Main-only docs/TASKS/REVIEW drift reported separately, never rebaselined. Intentional U1 delta is not checked against obsolete f0b/held source expectations.`,
  );
}
