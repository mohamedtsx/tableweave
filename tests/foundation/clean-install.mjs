import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
await mkdir(join(root, ".artifacts"), { recursive: true });
const target = await mkdtemp(join(root, ".artifacts/clean-install-"));
for (const file of [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
  "packages/react/package.json",
  "packages/heroui/package.json",
  "apps/storybook/package.json",
  "apps/example-start/package.json",
  "patches/react-aria-components@1.22.1.patch",
  "patches/@tanstack__start-server-core@1.169.40.patch",
  "patches/@tanstack__start-plugin-core@1.171.50.patch",
  "patches/@heroui__react@3.2.8.patch",
]) {
  await mkdir(dirname(join(target, file)), { recursive: true });
  await cp(join(root, file), join(target, file));
}
const before = await readFile(join(target, "pnpm-lock.yaml"), "utf8");
const result = spawnSync("pnpm", ["install", "--frozen-lockfile"], {
  cwd: target,
  stdio: "inherit",
  env: { ...process.env, CI: "1" },
});
if (result.error) throw result.error;
assert.equal(result.status, 0, "Fresh workspace install failed");
assert.equal(
  await readFile(join(target, "pnpm-lock.yaml"), "utf8"),
  before,
  "Frozen install modified the lockfile",
);
console.log(
  "Fresh manifest-only workspace install passed; lockfile unchanged. Package cache may be reused.",
);
