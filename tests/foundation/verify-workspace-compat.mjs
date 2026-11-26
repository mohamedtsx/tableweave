import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Workspace byte check only. The shipped explicit CLI separately verifies genuine
// isolated consumers; this does not pretend the monorepo has that consumer layout.
const root = await realpath(fileURLToPath(new URL("../../", import.meta.url)));
const directory = join(root, "packages/heroui/compat/rac-table-clone");
const profile = JSON.parse(
  await readFile(join(directory, "profile.json"), "utf8"),
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
assert.equal(profile.upstream.name, "react-aria-components");
assert.equal(profile.upstream.version, "1.22.1");
for (const name of [
  "runtime.patch",
  "verify.mjs",
  "README.md",
  "NOTICE-RAC",
  "LICENSE-APACHE-2.0",
])
  assert.equal(
    hash(await readFile(join(directory, name))),
    profile.assets[name],
    `Workspace compatibility asset digest changed: ${name}`,
  );
assert.deepEqual(
  profile.files.map((file) => file.path),
  ["dist/private/Table.js", "dist/private/Table.mjs", "dist/private/Table.cjs"],
);
const require = createRequire(join(root, "packages/heroui/package.json"));
const manifest = await realpath(
  require.resolve("react-aria-components/package.json"),
);
assert(
  manifest.startsWith(`${root}${sep}node_modules${sep}.pnpm${sep}`),
  "Workspace compatibility check borrowed a dependency outside this checkout",
);
const metadata = JSON.parse(await readFile(manifest, "utf8"));
assert.equal(metadata.name, profile.upstream.name);
assert.equal(metadata.version, profile.upstream.version);
for (const file of profile.files)
  assert.equal(
    hash(await readFile(join(dirname(manifest), file.path))),
    file.afterSha256,
    `Workspace vendor runtime does not match the reviewed profile: ${file.path}`,
  );
console.log(
  "Workspace RAC clone runtime byte guards passed; no consumer-layout claim.",
);
