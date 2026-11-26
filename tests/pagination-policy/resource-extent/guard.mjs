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
  "packages/react/src/resource/types.ts":
    "1eba3f273584c16fa6eefa39cd497dcb4142dbcf44155fdda79ecdc2e62d8863",
  "packages/react/src/resource/adapter.ts":
    "f30a63afabb116bc3a1d71952ab1e5e1912535917699ea08ce5ac6ec3b9b4bc9",
  "packages/react/src/resource/view.ts":
    "7f3ef437d01824cb0e14a34520fa6fa67c72bf440aa85b2fb7b7cb234e529f7c",
};
export async function requireOriginal() {
  for (const [p, h] of Object.entries(original))
    assert.equal(
      hash(await readFile(join(root, p))),
      h,
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
      const p = join(dir, e.name);
      if (resolve(root, p) === own) continue;
      if (e.isDirectory()) await walk(p);
      else if (e.isFile()) map[p] = hash(await readFile(join(root, p)));
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
    assert(head.startsWith("0288904"));
    const map = await sourceMap();
    assert.equal(Object.keys(map).length, 105);
    const bytes = `${JSON.stringify(map, null, 2)}\n`;
    assert.equal(
      hash(bytes),
      "497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790",
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
    console.log(`Starting3 and source105497a1e37… verified at ${head}`);
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
    for (const [p, h] of Object.entries(seal))
      assert.equal(
        hash(await readFile(join(own, p))),
        h,
        `Immutable preimage: ${p}`,
      );
    assert.deepEqual(
      JSON.parse(await readFile(join(own, "legacy-baselines.json"), "utf8")),
      JSON.parse(
        await readFile(join(art, "legacy-baselines.raw.json"), "utf8"),
      ),
    );
    const report = {
      protectedSources: 102,
      otherProtected: Object.keys(await otherInputs()).length,
      unchanged: true,
      prechangeSealUnchanged: true,
      sources: Object.fromEntries(
        Object.keys(original).map((p) => [p, after[p].sha256]),
      ),
    };
    await writeFile(
      join(art, "protected-after.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } else throw new Error("Use --before or --after");
}
