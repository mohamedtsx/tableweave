import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = "tests/criteria-builder-format/";
const sources = ["criteria-builder-host.tsx", "filter-builder.tsx", "option-owners.tsx", "types.ts", "value-editors.tsx"].map(name => `packages/heroui/src/filters/${name}`);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const external = "/tmp/opencode/wp09-after-builder-source128.json";
const bytes = await readFile(external);
assert.equal(hash(bytes), "8d4cd2f6cfc5fa1dcd708a12118b608c84dac17366a9f385557363c4cff97197");
const canonical = JSON.parse(bytes);
assert.equal(Object.keys(canonical).length, 128);

async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", ".repo", ".artifacts", "dist", "build", "test-results", "playwright-report"].includes(entry.name) || entry.name.startsWith(".env") || entry.name === ".npmrc") continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (entry.isFile()) paths.push(relative(root, path));
  }
  return paths;
}
async function input(path) {
  return { sha256: hash(await readFile(resolve(root, path))), mode: (await stat(resolve(root, path))).mode & 0o777 };
}
async function protectedInputs() {
  const paths = (await walk(root)).filter(path => path !== "TASKS.md" && !sources.includes(path) && !path.startsWith(own)).sort();
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, await input(path)])));
}
const before = new URL("./before.json", import.meta.url);
if (process.argv[2] === "before") {
  for (const [path, expected] of Object.entries(canonical)) {
    const actual = await input(path);
    assert.equal(actual.sha256, expected.sha256, path);
    assert.equal(actual.mode & 0o111 ? "100755" : "100644", expected.mode, path);
  }
  const oldSeal = JSON.parse(await readFile(resolve(root, "tests/criteria-builder/handoff-hashes.json"), "utf8"));
  assert.equal(oldSeal.aggregate, "7422a760f9c995a2bf3a574cbb0d90d9a3133fdd62d8eb30b26541e95730a52b");
  for (const [path, expected] of Object.entries(oldSeal.files)) assert.deepEqual(await input(path), expected, path);
  const preimages = {};
  await mkdir(new URL("./preimages/", import.meta.url), { recursive: true });
  for (const path of sources) {
    const preimage = `${own}preimages/${path.split("/").at(-1)}.txt`;
    await writeFile(resolve(root, preimage), await readFile(resolve(root, path)), { flag: "wx" });
    preimages[path] = { ...await input(path), preimage };
  }
  const snapshot = { sourceMapSha256: hash(bytes), suppliedRevision: "bec322f (not Git-reverified)", exclusions: ["TASKS.md (main-supplied bookkeeping)", own, ...sources], preimages, protected: await protectedInputs() };
  await writeFile(before, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: "wx" });
  console.log(`Verified all 128 canonical sources and 32 historical sealed inputs; captured five exact preimages and ${Object.keys(snapshot.protected).length} protected files.`);
} else if (process.argv[2] === "reference") {
  const snapshot = JSON.parse(await readFile(before, "utf8"));
  const directory = new URL("./.artifacts/reference/", import.meta.url);
  await mkdir(directory, { recursive: true });
  for (const path of sources) {
    const original = await readFile(resolve(root, snapshot.preimages[path].preimage));
    assert.equal(hash(original), canonical[path].sha256, path);
    const result = spawnSync(process.execPath, ["node_modules/@biomejs/biome/bin/biome", "format", `--stdin-file-path=${path}`], { cwd: root, input: original, encoding: "utf8" });
    const name = path.split("/").at(-1);
    await writeFile(new URL(`${name}.log`, directory), `${result.stderr ?? ""}`, { flag: "wx" });
    assert.equal(result.status, 0, result.stderr);
    await writeFile(new URL(`${name}.txt`, directory), result.stdout, { flag: "wx" });
    console.log(`${name}: ${original.length} -> ${Buffer.byteLength(result.stdout)} bytes; ${result.stdout.split("\n").length - 1} reference lines; no production writes.`);
  }
} else {
  const snapshot = JSON.parse(await readFile(before, "utf8"));
  assert.deepEqual(await protectedInputs(), snapshot.protected);
  for (const [path, expected] of Object.entries(canonical)) {
    const actual = await input(path);
    if (!sources.includes(path)) assert.equal(actual.sha256, expected.sha256, path);
    assert.equal(actual.mode & 0o111 ? "100755" : "100644", expected.mode, path);
  }
  for (const [path, expected] of Object.entries(snapshot.preimages)) {
    assert.equal(hash(await readFile(resolve(root, expected.preimage))), expected.sha256, expected.preimage);
    assert.equal((await input(path)).mode, expected.mode, path);
  }
  console.log(`${Object.keys(snapshot.protected).length} protected files / 123 protected sources / five preimages and production modes unchanged.`);
}
