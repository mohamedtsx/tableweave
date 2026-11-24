import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const allocated = {
  "packages/react/src/controller/store.ts":
    "92a00f9272b98ca940b67b12e7eed08bd49c0ae83c3db12c5a1551e7ecd198a7",
  "packages/react/src/controller/reducer.ts":
    "c5a1e3fb25a543d8d501dfed9cea9d200c73277b6af3db20aa552eb42d945774",
};
export async function runtimeMap() {
  const lines = execFileSync(
    "git",
    ["ls-files", "--stage", "packages/react/src", "packages/heroui/src"],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n");
  const map = {};
  for (const line of lines) {
    const [metadata, path] = line.split("\t");
    map[path] = {
      mode: metadata.split(" ")[0],
      sha256: hash(await readFile(join(root, path))),
    };
  }
  return Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}
export async function otherInputs() {
  const map = {};
  async function walk(relative) {
    for (const entry of await readdir(join(root, relative), {
      withFileTypes: true,
    })) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      const path = join(relative, entry.name);
      if (resolve(root, path) === own) continue;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile())
        map[path] = hash(await readFile(join(root, path)));
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
  return Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => a.localeCompare(b)),
  );
}
export async function requireOriginal() {
  for (const [path, digest] of Object.entries(allocated))
    assert.equal(
      hash(await readFile(join(root, path))),
      digest,
      `Before-only operation refused: ${path}`,
    );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const artifacts = join(own, ".artifacts");
  await mkdir(artifacts, { recursive: true });
  if (process.argv[2] === "--before") {
    await requireOriginal();
    assert.equal(
      execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      "cb1c729869ae8cb4f71ad8832efd4288a879feaf",
    );
    const map = await runtimeMap();
    assert.equal(Object.keys(map).length, 105);
    const text = `${JSON.stringify(map, null, 2)}\n`;
    assert.equal(
      hash(text),
      "b9a3e8ee7deeac595ddc168c3ea7e23bef83c4425b96f455a68ef8156cf725b5",
    );
    await writeFile(join(artifacts, "before-runtime105.json"), text, {
      flag: "wx",
    });
    await writeFile(
      join(artifacts, "before-other.json"),
      JSON.stringify(await otherInputs(), null, 2),
      { flag: "wx" },
    );
    for (const path of Object.keys(allocated))
      await writeFile(
        join(artifacts, `original-${path.split("/").at(-1)}`),
        await readFile(join(root, path)),
        { flag: "wx" },
      );
    console.log(
      "Starting two hashes +105-source common baseline b9a3e8ee verified and sealed",
    );
  } else if (process.argv[2] === "--after") {
    const before = JSON.parse(
      await readFile(join(artifacts, "before-runtime105.json"), "utf8"),
    );
    const after = await runtimeMap();
    assert.deepEqual(Object.keys(after), Object.keys(before));
    for (const path of Object.keys(before))
      if (!Object.hasOwn(allocated, path))
        assert.deepEqual(
          after[path],
          before[path],
          `Protected runtime: ${path}`,
        );
    assert.deepEqual(
      await otherInputs(),
      JSON.parse(await readFile(join(artifacts, "before-other.json"), "utf8")),
    );
    const seal = JSON.parse(
      await readFile(join(artifacts, "prechange-seal.json"), "utf8"),
    );
    assert.deepEqual(
      JSON.parse(await readFile(join(own, "paged-baselines.json"), "utf8")),
      JSON.parse(
        await readFile(join(artifacts, "paged-baselines.json"), "utf8"),
      ),
      "Durable formatted fixture must contain exactly the original literal bytes",
    );
    // The original raw JSON capture was archived byte-for-byte, not reformatted.
    // Keep the original seal/key/digest intact; disclose this one physical move.
    for (const [path, digest] of Object.entries(seal))
      assert.equal(
        hash(
          await readFile(
            join(
              own,
              path === "paged-baselines.json"
                ? ".artifacts/paged-baselines.json"
                : path,
            ),
          ),
        ),
        digest,
        `Prechange evidence changed: ${path}`,
      );
    const output = {
      protectedRuntimeSources: 103,
      unchanged: true,
      otherInputs: Object.keys(await otherInputs()).length,
      source: Object.fromEntries(
        Object.keys(allocated).map((path) => [path, after[path].sha256]),
      ),
      prechangeSealUnchanged: true,
    };
    await writeFile(
      join(artifacts, "protected-after.json"),
      JSON.stringify(output, null, 2),
    );
    console.log(JSON.stringify(output, null, 2));
  } else throw new Error("Use --before or --after");
}
