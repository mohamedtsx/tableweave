import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/workbench/wp11-start-facade/";
const app = "apps/example-start-facade/";
const names = [
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.source-light.json",
  "README.md",
  ".gitignore",
  "src/router.tsx",
  "src/start.ts",
  "src/register.d.ts",
  ...["__root.tsx", "index.tsx", "away.tsx"].map(
    (name) => `src/routes/${name}`,
  ),
  ...[
    "types.ts",
    "codec.ts",
    "query-options.ts",
    "bootstrap-session.ts",
    "table-source.ts",
    "functions.ts",
    "transport.ts",
    "reader.server.ts",
  ].map((name) => `src/application/${name}`),
  "src/table/HeadlessTable.tsx",
  "src/table/TablePage.tsx",
];
const leased = names.map((name) => app + name);
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
for (const [path, expected] of Object.entries(canonical)) {
  const current = await measure(path);
  assert.equal(current.sha256, expected.sha256, path);
  assert.equal(current.mode & 0o111 ? "100755" : "100644", expected.mode, path);
}
assert.equal(
  (await measure("pnpm-lock.yaml")).sha256,
  "190f5b3759b5071d440e17ed652eeb70dc5ffe927abf37daa02f9f6a89bdeea6",
);
assert.equal(
  (await measure(`${app}package.json`)).sha256,
  "730489283fbf1223427912c49e4028461a0dcb4dbe4295a35c268c19e8611d6b",
);
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      [".git", ".repo", "node_modules"].includes(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name === ".npmrc"
    )
      continue;
    const path = resolve(directory, entry.name),
      rel = relative(root, path);
    if (`${rel}/` === own) continue;
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else if (entry.isFile() && !leased.includes(rel)) result.push(rel);
  }
  return result;
}
const current = Object.fromEntries(
  await Promise.all(
    (await walk(root)).sort().map(async (path) => [path, await measure(path)]),
  ),
);
const target = new URL("./before.json", import.meta.url);
if (process.argv[2] === "before") {
  for (const path of leased)
    await assert.rejects(access(resolve(root, path)), { code: "ENOENT" });
  await writeFile(
    target,
    `${JSON.stringify({ suppliedHead: "f7ad033 (no worker Git inspection)", canonical155: canonical, canonicalSHA: hash(canonicalBytes), leased, protectedInputs: current }, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `Before edits:155 libraries, protected manifest/lock and ${Object.keys(current).length} ACTUAL old regular files/modes captured. Absent producer raw artifacts are not invented.`,
  );
} else {
  const before = JSON.parse(await readFile(target, "utf8"));
  assert.deepEqual(before.leased, leased);
  assert.deepEqual(current, before.protectedInputs);
  console.log(
    `155 libraries and all ${Object.keys(current).length} actual old regular inputs/modes unchanged, including all present A/B seals/profile/G-04 and main manifest/lock.`,
  );
}
