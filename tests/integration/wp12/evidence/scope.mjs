import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  readdir,
  stat,
  statfs,
  writeFile,
} from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../../../../", import.meta.url));
export const own = "tests/integration/wp12/";
export const leased = [
  "index.html",
  "main.tsx",
  "application.tsx",
  "events.ts",
  "styles.css",
  "styles.d.ts",
  "vite.config.ts",
  "playwright.config.ts",
  "browser.spec.ts",
  "tsconfig.light.json",
  "README.md",
  "manual.md",
].map((name) => own + name);
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export async function capacity() {
  const available = await statfs(root);
  const bytes = available.bavail * available.bsize;
  assert(bytes >= 128 * 1024 * 1024, "STOP: below128MiB; no cleanup authority");
  return bytes;
}
export async function measure(path) {
  const absolute = resolve(root, path);
  return {
    sha256: hash(await readFile(absolute)),
    mode: (await stat(absolute)).mode & 0o7777,
  };
}
export async function walk(directory, excludeOwn = true) {
  const result = [];
  for (const entry of await readdir(resolve(root, directory), {
    withFileTypes: true,
  })) {
    if (
      ["node_modules", ".git", ".repo", ".npmrc"].includes(entry.name) ||
      /^(?:\.env|credentials|secrets)/i.test(entry.name) ||
      /\.(?:pem|key|crt)$/.test(entry.name)
    )
      continue;
    const path = relative(root, resolve(root, directory, entry.name));
    if (excludeOwn && `${path}/` === own) continue;
    // Future final runtime artifacts are a separate generation, never folded
    // into this source/LIGHT producer's original input or artifact identity.
    if (`${path}/` === `${own}evidence/.runtime/`) continue;
    if (entry.isDirectory()) result.push(...(await walk(path, excludeOwn)));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}
async function scope() {
  const availableBytes = await capacity();
  const canonicalBytes = await readFile(
    "/tmp/opencode/wp10-move-reason-integrated-source155.json",
  );
  assert.equal(
    hash(canonicalBytes),
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837",
  );
  const canonical = JSON.parse(canonicalBytes);
  assert.equal(Object.keys(canonical).length, 155);
  for (const [path, expected] of Object.entries(canonical)) {
    const actual = await measure(path);
    assert.equal(actual.sha256, expected.sha256, path);
    assert.equal(
      actual.mode & 0o111 ? "100755" : "100644",
      expected.mode,
      path,
    );
  }
  const inputs = {};
  for (const path of await walk(".")) inputs[path] = await measure(path);
  const target = new URL("./before.json", import.meta.url);
  if (process.argv[2] === "before") {
    for (const path of leased)
      await assert.rejects(access(resolve(root, path)), { code: "ENOENT" });
    await mkdir(new URL("./preimages/", import.meta.url));
    await writeFile(
      new URL("./preimages/source155.json", import.meta.url),
      canonicalBytes,
      { flag: "wx" },
    );
    await writeFile(
      target,
      `${JSON.stringify({ suppliedBase: "a5e347d + main docs/TASKS/REVIEW WIP; no Git inspection", availableBytes, canonical155: hash(canonicalBytes), leased, inputs }, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      `Baseline:155canonical hashes/modes; ${Object.keys(inputs).length} old regular files; ${availableBytes} available bytes. No old map rebaselined.`,
    );
  } else {
    const before = JSON.parse(await readFile(target, "utf8"));
    assert.deepEqual(before.leased, leased);
    const bookkeeping = (path) =>
      path.startsWith("docs/") || ["TASKS.md", "REVIEW.md"].includes(path);
    const frozen = (input) =>
      Object.fromEntries(
        Object.entries(input).filter(([path]) => !bookkeeping(path)),
      );
    assert.deepEqual(
      frozen(inputs),
      frozen(before.inputs),
      "Frozen old input drift",
    );
    const drift = [
      ...new Set([...Object.keys(inputs), ...Object.keys(before.inputs)]),
    ]
      .filter(bookkeeping)
      .filter(
        (path) =>
          JSON.stringify(inputs[path]) !== JSON.stringify(before.inputs[path]),
      );
    console.log(
      `155canonical and ${Object.keys(frozen(inputs)).length} frozen old inputs unchanged; main-only drift: ${JSON.stringify(drift)}`,
    );
    assert.equal(
      hash(
        await readFile(new URL("./preimages/source155.json", import.meta.url)),
      ),
      hash(canonicalBytes),
    );
    const additions = await walk(own, false);
    assert(
      additions.every(
        (path) => leased.includes(path) || path.startsWith(`${own}evidence/`),
      ),
      "Outside exact new lease",
    );
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await scope();
