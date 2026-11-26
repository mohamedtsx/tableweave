import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../..");
export const source = "packages/heroui/src/localization/";
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export async function protectedInputs() {
  const entries = [];
  for (const line of execFileSync("git", ["ls-files", "--stage"], {
    cwd: root,
    encoding: "utf8",
  }).trim().split("\n")) {
    const [metadata, path] = line.split("\t");
    if (path.startsWith(source) || path.startsWith("tests/localization/")) continue;
    entries.push([path, {
      mode: metadata.split(" ")[0],
      workingMode: (await stat(join(root, path))).mode & 0o777,
      sha256: hash(await readFile(join(root, path))),
    }]);
  }
  return Object.fromEntries(entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}
export async function ownedInputs() {
  const result = {};
  async function walk(path) {
    for (const item of await readdir(join(root, path), { withFileTypes: true })) {
      if (item.name === ".artifacts") continue;
      const next = join(path, item.name);
      if (item.isDirectory()) await walk(next);
      else if (item.isFile()) result[next] = hash(await readFile(join(root, next)));
    }
  }
  await walk(source);
  await walk("tests/localization");
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}
export async function requireProtected() {
  const current = await protectedInputs();
  assert.deepEqual(current, JSON.parse(await readFile(join(own, ".artifacts/protected-before.json"), "utf8")));
  return current;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = join(own, ".artifacts");
  await mkdir(output, { recursive: true });
  const current = await protectedInputs();
  const runtime = Object.fromEntries(Object.entries(current)
    .filter(([p]) => /^packages\/(react|heroui)\/src\//.test(p))
    .map(([p, value]) => [p, { mode: value.mode, sha256: value.sha256 }]));
  assert.equal(Object.keys(runtime).length, 105);
  assert.equal(hash(`${JSON.stringify(runtime, null, 2)}\n`), "497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790");
  const bootstrap = Object.fromEntries(Object.entries(current).filter(([p]) => p.startsWith("tests/criteria-bootstrap/")));
  assert.equal(Object.keys(bootstrap).length, 10);
  if (process.argv[2] === "before") {
    const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    assert(head.startsWith("f05bdb6"));
    await writeFile(join(output, "protected-before.json"), JSON.stringify(current, null, 2), { flag: "wx" });
    await writeFile(join(output, "baseline.json"), JSON.stringify({ head, protectedInputs: Object.keys(current).length, aggregate: hash(JSON.stringify(current)), bootstrapInputs: bootstrap, captureBoundary: "existing inputs captured after new module authoring, before light checks; historical bootstrap guard untouched" }, null, 2), { flag: "wx" });
  } else {
    assert.equal(process.argv[2], "after");
    await requireProtected();
    const owned = await ownedInputs();
    await writeFile(join(output, "scope-after.json"), JSON.stringify({ unchanged: true, protectedInputs: Object.keys(current).length, protectedAggregate: hash(JSON.stringify(current)), originalRuntime105: true, bootstrap10: true, owned, ownedAggregate: hash(JSON.stringify(owned)) }, null, 2));
  }
  console.log(`Existing ${Object.keys(current).length} inputs sealed; original105 + bootstrap10 protected; new localization namespace only.`);
}
