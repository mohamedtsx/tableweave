import assert from "node:assert/strict";
import { access, lstat, readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

export const consumerWorkspace = "packages: []\n";
export const consumerNpmrc =
  "auto-install-peers=false\nstrict-peer-dependencies=true\nignore-scripts=true\nshared-workspace-lockfile=false\nnode-linker=isolated\n";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return false;
  }
}

/** Fixed approved external parent, never an arbitrary sibling workspace child. */
export async function requireConsumerTarget(directory, phase) {
  assert(["prepare", "install"].includes(phase));
  assert(typeof directory === "string" && isAbsolute(directory));
  const approved = await realpath("/tmp/opencode");
  const location = resolve(directory);
  assert.equal(
    dirname(location),
    approved,
    "Consumer must be a direct child of the approved external parent",
  );
  for (const marker of [".git", "pnpm-workspace.yaml", "package.json"])
    assert(
      !(await exists(resolve(approved, marker))),
      "Approved external parent must not itself be a workspace/project",
    );
  let entry = null;
  try {
    entry = await lstat(location);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (phase === "prepare") {
    assert.equal(entry, null, "Preparation requires a new, nonexistent target");
    return location;
  }
  assert(entry?.isDirectory() && !entry.isSymbolicLink());
  assert.equal(await realpath(location), location, "No substituted symlink");
  assert(!(await exists(resolve(location, ".git"))), "No Git worktree target");
  assert.equal(
    await readFile(resolve(location, "pnpm-workspace.yaml"), "utf8"),
    consumerWorkspace,
    "Only the prepared empty standalone workspace marker is permitted",
  );
  assert.equal(
    await readFile(resolve(location, ".npmrc"), "utf8"),
    consumerNpmrc,
    "Prepared strict ordinary-consumer configuration changed",
  );
  return location;
}
