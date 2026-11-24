import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const original = {
  "packages/react/src/tanstack/types.ts":
    "a72486264cd77d8cfd80db9e1f74d57e95dcda57d9a441ba3eb2e81f99ffb2b3",
  "packages/react/src/tanstack/definition.ts":
    "9f0a6ae53e0fdf33dd976d30861eef88ae54d92d60a3c58d5a0ee5e1601db3b0",
  "packages/react/src/tanstack/adapter.ts":
    "f2add671658a719c98ecbc6712ba6cf2db275b90b9196c149806103e5bf949a4",
};
export async function requireOriginal() {
  for (const [p, digest] of Object.entries(original))
    assert.equal(
      hash(await readFile(join(root, p))),
      digest,
      `Before-only operation refused: ${p}`,
    );
}
export async function sourceMap() {
  const map = {};
  for (const line of execFileSync(
    "git",
    ["ls-files", "--stage", "packages/react/src", "packages/heroui/src"],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")) {
    const [meta, path] = line.split("\t");
    map[path] = {
      mode: meta.split(" ")[0],
      sha256: hash(await readFile(join(root, path))),
    };
  }
  return Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}
export async function otherInputs() {
  const map = {};
  async function walk(dir) {
    for (const e of await readdir(join(root, dir), { withFileTypes: true })) {
      if (["node_modules", "dist"].includes(e.name)) continue;
      const path = join(dir, e.name);
      if (resolve(root, path) === own) continue;
      if (e.isDirectory()) await walk(path);
      else if (e.isFile()) map[path] = hash(await readFile(join(root, path)));
    }
  }
  await walk("tests");
  for (const p of [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "biome.json",
    "tsconfig.base.json",
    "vitest.config.ts",
    "playwright.config.ts",
    "packages/react/package.json",
    "packages/heroui/package.json",
    "packages/react/tsconfig.json",
    "packages/react/tsconfig.build.json",
    "packages/heroui/tsconfig.json",
    "packages/heroui/tsconfig.build.json",
  ])
    map[p] = hash(await readFile(join(root, p)));
  return map;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const art = join(own, ".artifacts");
  await mkdir(art, { recursive: true });
  if (process.argv[2] === "--before") {
    await requireOriginal();
    const head = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    assert(head.startsWith("9f96deb"));
    const map = await sourceMap();
    assert.equal(Object.keys(map).length, 105);
    const bytes = `${JSON.stringify(map, null, 2)}\n`;
    assert.equal(
      hash(bytes),
      "abba84ba882b2d6d6fa596b74f91003308ed6d249001fa2084ebdef40a8403c2",
    );
    await writeFile(join(art, "before-source105.json"), bytes, { flag: "wx" });
    await writeFile(
      join(art, "before-other.json"),
      JSON.stringify(await otherInputs(), null, 2),
      { flag: "wx" },
    );
    for (const p of Object.keys(original))
      await writeFile(
        join(art, `original-${p.split("/").at(-1)}`),
        await readFile(join(root, p)),
        { flag: "wx" },
      );
    console.log(`Verified starting3 + post-U1 source105 abba84… at ${head}`);
  } else if (process.argv[2] === "--after") {
    const before = JSON.parse(
        await readFile(join(art, "before-source105.json"), "utf8"),
      ),
      after = await sourceMap();
    assert.deepEqual(Object.keys(after), Object.keys(before));
    for (const p of Object.keys(before))
      if (!Object.hasOwn(original, p))
        assert.deepEqual(after[p], before[p], `Protected source: ${p}`);
    assert.deepEqual(
      await otherInputs(),
      JSON.parse(await readFile(join(art, "before-other.json"), "utf8")),
    );
    const seal = JSON.parse(
      await readFile(join(art, "prechange-seal.json"), "utf8"),
    );
    for (const [p, digest] of Object.entries(seal))
      assert.equal(
        hash(await readFile(join(own, p))),
        digest,
        `Immutable prechange evidence: ${p}`,
      );
    assert.deepEqual(
      JSON.parse(await readFile(join(own, "paged-baselines.json"), "utf8")),
      JSON.parse(await readFile(join(art, "paged-baselines.raw.json"), "utf8")),
    );
    const result = {
      protectedRuntimeSources: 102,
      otherProtected: Object.keys(await otherInputs()).length,
      unchanged: true,
      prechangeSealUnchanged: true,
      source: Object.fromEntries(
        Object.keys(original).map((p) => [p, after[p].sha256]),
      ),
    };
    await writeFile(
      join(art, "protected-after.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  } else throw new Error("Use --before or --after");
}
