// Authored adversaries for the FINAL phase. Not executed by source/LIGHT checks.
import assert from "node:assert/strict";
import {
  access,
  mkdtemp,
  rmdir,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
  consumerNpmrc,
  consumerWorkspace,
  requireConsumerTarget,
} from "./boundary.mjs";

test("a nested sibling worktree cannot become an install workspace", async (t) => {
  const sibling = await mkdtemp("/tmp/opencode/wp11-boundary-worktree-");
  await writeFile(join(sibling, ".git"), "gitdir: synthetic-only\n");
  t.after(async () => {
    await unlink(join(sibling, ".git"));
    await rmdir(sibling);
  });
  const target = join(sibling, "consumer");
  await assert.rejects(requireConsumerTarget(target, "prepare"));
  await assert.rejects(requireConsumerTarget(sibling, "install"));
  await assert.rejects(access(target), { code: "ENOENT" });
});

test("valid preparation is read-only and requires a new direct child", async (t) => {
  const own = await mkdtemp("/tmp/opencode/wp11-boundary-fresh-");
  t.after(() => rmdir(own));
  const target = `${own}-consumer`;
  assert.equal(await requireConsumerTarget(target, "prepare"), target);
  await assert.rejects(access(target), { code: "ENOENT" });
  await assert.rejects(requireConsumerTarget(own, "prepare"));
  for (const invalid of ["/", "/tmp/opencode", "/tmp/not-approved", "relative"])
    await assert.rejects(requireConsumerTarget(invalid, "prepare"));
});

test("install requires the exact prepared empty-workspace configuration", async (t) => {
  const target = await mkdtemp("/tmp/opencode/wp11-boundary-prepared-");
  const marker = join(target, "pnpm-workspace.yaml");
  const config = join(target, ".npmrc");
  await writeFile(marker, consumerWorkspace);
  await writeFile(config, consumerNpmrc);
  t.after(async () => {
    await unlink(marker);
    await unlink(config);
    await rmdir(target);
  });
  assert.equal(await requireConsumerTarget(target, "install"), target);
  await writeFile(marker, "packages:\n  - apps/*\n");
  await assert.rejects(requireConsumerTarget(target, "install"));
  await writeFile(marker, consumerWorkspace);
  await writeFile(config, "auto-install-peers=true\n");
  await assert.rejects(requireConsumerTarget(target, "install"));
});

test("a substituted direct-child symlink cannot redirect installation", async (t) => {
  const target = await mkdtemp("/tmp/opencode/wp11-boundary-symlink-");
  const alias = `${target}-alias`;
  await symlink(target, alias, "dir");
  t.after(async () => {
    await unlink(alias);
    await rmdir(target);
  });
  await assert.rejects(requireConsumerTarget(alias, "prepare"));
  await assert.rejects(requireConsumerTarget(alias, "install"));
});
