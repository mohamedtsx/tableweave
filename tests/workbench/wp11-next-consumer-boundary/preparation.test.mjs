// FINAL phase only: authored Node filesystem/process cases, never a Next install.
import assert from "node:assert/strict";
import { access, mkdtemp, rmdir, unlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

test("Next preparation denies a sibling-workspace child before archive reads/writes", async (t) => {
  const sibling = await mkdtemp("/tmp/opencode/wp11-next-boundary-");
  await writeFile(join(sibling, "pnpm-workspace.yaml"), "packages: []\n");
  t.after(async () => {
    await unlink(join(sibling, "pnpm-workspace.yaml"));
    await rmdir(sibling);
  });
  const destination = join(sibling, "consumer");
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL("../wp11-next/packed/prepare.mjs", import.meta.url),
      ),
      destination,
      join(sibling, "missing-react.tgz"),
      join(sibling, "missing-heroui.tgz"),
    ],
    { encoding: "utf8", env: { ...process.env, WP11_NEXT_FINAL: "1" } },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /direct child of the approved external parent/);
  assert.doesNotMatch(result.stderr, /realpath.*missing-react/);
  await assert.rejects(access(destination), { code: "ENOENT" });
});
