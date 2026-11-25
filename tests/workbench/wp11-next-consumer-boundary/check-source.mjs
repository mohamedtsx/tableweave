import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const target = "tests/workbench/wp11-next/packed/prepare.mjs";
const owner = "apps/example-next/lib/client-owner.ts";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const original = JSON.parse(
  await readFile("tests/workbench/wp11-next/handoff-hashes.json", "utf8"),
);
const previous = spawnSync("git", ["show", `17a1439:${target}`]);
assert.equal(previous.status, 0);
assert.equal(digest(previous.stdout), original[target].sha256);
for (const [file, expected] of Object.entries(original))
  if (file !== owner && file !== target)
    assert.equal(digest(await readFile(file)), expected.sha256, file);
const correction = JSON.parse(
  await readFile(
    "tests/workbench/wp11-next-connection/handoff-hashes.json",
    "utf8",
  ),
);
for (const [file, expected] of Object.entries(correction))
  assert.equal(digest(await readFile(file)), expected.sha256, file);
const source = JSON.parse(
  await readFile("tests/workbench/wp11-next/source155-before.json", "utf8"),
);
for (const [file, expected] of Object.entries(source))
  assert.equal(digest(await readFile(file)), expected.sha256, file);
assert.equal(Object.keys(source).length, 155);
const text = await readFile(target, "utf8");
assert(text.includes('from "../../wp11-consumer-boundary/boundary.mjs"'));
const guard = text.indexOf('await requireConsumerTarget(directory, "prepare")');
assert(guard >= 0);
assert(guard < text.indexOf("const archive ="));
assert(guard < text.indexOf("fs.mkdirSync(destination)"));
assert(!text.includes("mkdirSync(destination, { recursive: true })"));
assert(text.includes("!path.isAbsolute(reactArchive)"));
assert(text.includes("!path.isAbsolute(styledArchive)"));
assert(text.includes('path.join(destination, "pnpm-workspace.yaml")'));
assert(text.includes('path.join(destination, ".npmrc"), consumerNpmrc'));
assert(!/spawnSync|execSync/.test(text));
console.log(
  "Static guarded preparation checks pass;78 other original inputs,44 connection inputs and155 library sources unchanged. No consumer preparation/helper/fixture/install executed.",
);
