import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../..");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export async function inputs() {
  const all = {};
  for (const line of execFileSync("git", ["ls-files", "--stage"], {
    cwd: root,
    encoding: "utf8",
  }).trim().split("\n")) {
    const [meta, path] = line.split("\t");
    if (path.startsWith("tests/criteria-bootstrap/")) continue;
    all[path] = { mode: meta.split(" ")[0], sha256: hash(await readFile(join(root, path))) };
  }
  return Object.fromEntries(Object.entries(all).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const art = join(own, ".artifacts");
  await mkdir(art, { recursive: true });
  const all = await inputs();
  const source = Object.fromEntries(Object.entries(all).filter(([p]) => /^packages\/(react|heroui)\/src\//.test(p)));
  const bytes = `${JSON.stringify(source, null, 2)}\n`;
  assert.equal(Object.keys(source).length, 105);
  assert(hash(bytes).startsWith("497a1e37"), "Requires frozen accepted pre-U3 source map");
  if (process.argv[2] === "before") {
    const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    assert(head.startsWith("0288904"));
    await writeFile(join(art, "protected-before.json"), JSON.stringify(all, null, 2), { flag: "wx" });
    await writeFile(join(art, "source105.json"), bytes, { flag: "wx" });
    await writeFile(join(art, "baseline.json"), JSON.stringify({ head, source105: hash(bytes), protectedInputs: Object.keys(all).length, aggregate: hash(JSON.stringify(all)) }, null, 2), { flag: "wx" });
  } else {
    assert.equal(process.argv[2], "after");
    assert.deepEqual(all, JSON.parse(await readFile(join(art, "protected-before.json"), "utf8")));
    await writeFile(join(art, "protected-after.json"), JSON.stringify({ unchanged: true, source105: hash(bytes), protectedInputs: Object.keys(all).length, aggregate: hash(JSON.stringify(all)) }, null, 2));
  }
  console.log(`Protected ${Object.keys(all).length} existing inputs; all105 source map ${hash(bytes)}`);
}
