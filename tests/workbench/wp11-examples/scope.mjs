import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
  access,
} from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/workbench/wp11-examples/";
export const leased = [
  ...[
    "index.html",
    "headless.html",
    "main.tsx",
    "headless.tsx",
    "styles.css",
    "README.md",
  ].map((name) => `apps/examples/vite/${name}`),
  ...[
    "custom-cells.tsx",
    "row-bulk-actions.tsx",
    "custom-filter.tsx",
    "locale-recovery.tsx",
    "README.md",
  ].map((name) => `apps/examples/recipes/${name}`),
  "apps/storybook/vite.examples.config.ts",
  "apps/storybook/tsconfig.examples-light.json",
  ...["query-options.ts", "table-owner.ts", "TableRecipe.tsx", "README.md"].map(
    (name) => `apps/example-start/src/recipes/wp11/${name}`,
  ),
  "apps/example-start/tsconfig.wp11-light.json",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const bytes = await readFile(
  "/tmp/opencode/wp10-move-reason-integrated-source155.json",
);
assert.equal(
  hash(bytes),
  "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837",
);
const canonical = JSON.parse(bytes);
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
    if (
      ["node_modules", ".git", ".repo"].includes(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name === ".npmrc"
    )
      continue;
    const path = resolve(directory, entry.name),
      rel = relative(root, path);
    if (`${rel}/` === own) continue;
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (entry.isFile() && !leased.includes(rel)) paths.push(rel);
  }
  return paths;
}
for (const [path, expected] of Object.entries(canonical)) {
  const actual = await measure(path);
  assert.equal(actual.sha256, expected.sha256, path);
  assert.equal(actual.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
const before = process.argv[2] === "before";
const current = Object.fromEntries(
  await Promise.all(
    (await walk(root)).sort().map(async (path) => [path, await measure(path)]),
  ),
);
const target = new URL("./before.json", import.meta.url);
if (before) {
  for (const path of leased)
    await assert.rejects(
      access(resolve(root, path)),
      { code: "ENOENT" },
      `New-only lease: ${path}`,
    );
  await mkdir(new URL("./preimages/", import.meta.url));
  await writeFile(
    new URL("./preimages/source155.json", import.meta.url),
    bytes,
    { flag: "wx" },
  );
  await writeFile(
    target,
    `${JSON.stringify({ suppliedBase: "9ce41bd (no worker Git inspection)", canonical155: hash(bytes), leased, protectedInputs: current }, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `NEW Stage B baseline:155 library sources/modes match; ${Object.keys(current).length} post-9ce41bd old regular files captured, including all Stage A code/CSS/seals/artifacts and the seven intaken historical evidence files. No old producer map rebaselined.`,
  );
} else {
  const original = JSON.parse(await readFile(target, "utf8"));
  assert.deepEqual(original.leased, leased);
  const bookkeeping = (path) =>
    path.startsWith("docs/") || ["TASKS.md", "REVIEW.md"].includes(path);
  const drift = [
    ...new Set([
      ...Object.keys(current),
      ...Object.keys(original.protectedInputs),
    ]),
  ]
    .filter(bookkeeping)
    .filter(
      (path) =>
        JSON.stringify(current[path]) !==
        JSON.stringify(original.protectedInputs[path]),
    );
  console.log(
    `Main-only metadata drift, NOT rebaselined: ${JSON.stringify(drift)}`,
  );
  const frozen = (record) =>
    Object.fromEntries(
      Object.entries(record).filter(([path]) => !bookkeeping(path)),
    );
  assert.deepEqual(frozen(current), frozen(original.protectedInputs));
  assert.equal(
    hash(
      await readFile(new URL("./preimages/source155.json", import.meta.url)),
    ),
    hash(bytes),
  );
  console.log(
    `All155 libraries and ${Object.keys(frozen(current)).length} old non-bookkeeping files/modes unchanged; preserved Stage A and post-9ce historical inputs remain exact.`,
  );
}
