import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const path = "tests/workbench/wp11-examples/consumer/driver.mjs";
const original = spawnSync("git", ["show", `5e72c95:${path}`]);
assert.equal(original.status, 0);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const stage = JSON.parse(
  await readFile("tests/workbench/wp11-examples/handoff-hashes.json", "utf8"),
);
assert.equal(hash(original.stdout), stage.inputs[path].sha256);
for (const [file, expected] of Object.entries(stage.inputs))
  if (file !== path)
    assert.equal(hash(await readFile(file)), expected.sha256, file);
const libraries = JSON.parse(
  await readFile(
    "tests/workbench/wp11-examples/preimages/source155.json",
    "utf8",
  ),
);
for (const [file, expected] of Object.entries(libraries))
  assert.equal(hash(await readFile(file)), expected.sha256, file);
assert.equal(Object.keys(libraries).length, 155);
const text = await readFile(path, "utf8");
const boundary = await readFile(
  "tests/workbench/wp11-consumer-boundary/boundary.mjs",
  "utf8",
);
for (const [name, content] of [
  [path, text],
  ["boundary.mjs", boundary],
]) {
  const parsed = ts.createSourceFile(
    name,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  assert.equal(parsed.parseDiagnostics.length, 0, name);
}
assert.equal(text.match(/"--ignore-workspace"/g)?.length, 2);
assert(text.includes("requireConsumerTarget("));
assert(text.includes('await run("typecheck", process.execPath'));
assert(!text.includes('["exec", "tsc"'));
assert(/compiler\.startsWith\(`\$\{location\}\/node_modules\/`\)/.test(text));
assert(/installed\.startsWith\(`\$\{location\}\/node_modules\/`\)/.test(text));
assert(boundary.includes('realpath("/tmp/opencode")'));
assert(boundary.includes("dirname(location)"));
assert(boundary.includes("!entry.isSymbolicLink()"));
assert(boundary.includes("consumerWorkspace"));
assert(boundary.includes("consumerNpmrc"));
assert(!/spawnSync|writeFile|mkdir|\.catch\(\(\) => \{\}\)/.test(boundary));
console.log(
  "Static hardened target/standalone install/compiler confinement checks pass;155 library hashes and all other Stage B inputs unchanged. No boundary test/consumer/driver/install executed.",
);
