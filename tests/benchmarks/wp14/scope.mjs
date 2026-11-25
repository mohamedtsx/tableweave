import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  statfs,
  writeFile,
} from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const root = fileURLToPath(new URL("../../../", import.meta.url));
export const own = "tests/benchmarks/wp14/";
export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export async function capacity() {
  const s = await statfs(root);
  assert(
    s.bavail * s.bsize >= 134217728,
    "Below128MiB: stop; no cleanup authority",
  );
}
export async function measure(path) {
  const bytes = await readFile(resolve(root, path)),
    s = await stat(resolve(root, path));
  return { sha256: sha(bytes), mode: s.mode & 0o777, size: bytes.length };
}
export async function files(directory, excludeOwn = false) {
  const result = [];
  for (const entry of await readdir(resolve(root, directory), {
    withFileTypes: true,
  })) {
    if (
      [".git", "node_modules", ".repo", ".npmrc"].includes(entry.name) ||
      entry.name.startsWith(".env")
    )
      continue;
    const path = relative(root, resolve(root, directory, entry.name));
    if (excludeOwn && `${path}/` === own) continue;
    if (entry.isDirectory()) result.push(...(await files(path, excludeOwn)));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}
export async function scope(capture = false) {
  const canonical = await readFile(
    "/tmp/opencode/wp10-move-reason-integrated-source155.json",
  );
  assert.equal(
    sha(canonical),
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837",
  );
  const source155 = JSON.parse(canonical);
  assert.equal(Object.keys(source155).length, 155);
  for (const [path, expected] of Object.entries(source155)) {
    const value = await measure(path);
    assert.equal(value.sha256, expected.sha256, path);
    assert.equal(value.mode & 0o111 ? "100755" : "100644", expected.mode, path);
  }
  const current = Object.fromEntries(
    await Promise.all(
      (await files(".", true)).map(async (path) => [path, await measure(path)]),
    ),
  );
  const beforePath = resolve(root, `${own}evidence/before.json`);
  if (capture) {
    await capacity();
    await mkdir(resolve(root, `${own}evidence`), { recursive: true });
    await writeFile(resolve(root, `${own}evidence/source155.json`), canonical, {
      flag: "wx",
    });
    await writeFile(
      beforePath,
      `${JSON.stringify({ suppliedHead: "25fdfde (main-reported; no worker Git)", canonical155: sha(canonical), files: current }, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      `BEFORE ${Object.keys(current).length} old regular inputs/modes and155 canonical source bodies captured; credentials/dependencies/Git/reference excluded.`,
    );
  } else {
    const before = JSON.parse(await readFile(beforePath, "utf8")),
      drift = [];
    for (const path of new Set([
      ...Object.keys(before.files),
      ...Object.keys(current),
    ])) {
      if (JSON.stringify(before.files[path]) === JSON.stringify(current[path]))
        continue;
      assert(
        ["TASKS.md", "REVIEW.md", "README.md"].includes(path) ||
          path.startsWith("docs/"),
        `FROZEN input drift: ${path}`,
      );
      drift.push(path);
    }
    assert.equal(
      sha(await readFile(resolve(root, `${own}evidence/source155.json`))),
      before.canonical155,
    );
    console.log(
      JSON.stringify({
        frozenOldInputs: Object.keys(before.files).length,
        libraries: 155,
        allowedMainBookkeepingDrift: drift,
        status: "source/mode scope only, NOT runtime",
      }),
    );
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert(["capture", "verify"].includes(process.argv[2]));
  await scope(process.argv[2] === "capture");
}
