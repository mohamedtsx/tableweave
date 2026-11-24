import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const original = {
  "types.ts":
    "2811e8bf0fc6351c74be93e8de06d75fd110bdedee11802aec0ff1eb9c608d39",
  "schema.ts":
    "7232c51f90581d54d9e66096cc2bae79a1b673195f40f88eed6aff2aa2934e84",
  "query.ts":
    "210a7711c607094ae079506a4b0e77bdce05f5a105d5cdd6a87fac1825ad36d0",
  "identity.ts":
    "76530b9aab896afadca85b310854457f6c7d7dcd959bfbbbdf3cbc121328b3c8",
};
export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export async function four() {
  return Object.fromEntries(
    await Promise.all(
      Object.keys(original).map(async (name) => [
        name,
        digest(
          await readFile(join(root, "packages/react/src/contracts", name)),
        ),
      ]),
    ),
  );
}
export async function snapshot() {
  const files = {};
  async function walk(relative) {
    for (const entry of await readdir(join(root, relative), {
      withFileTypes: true,
    })) {
      if (
        entry.name.startsWith(".") ||
        ["node_modules", "dist", "pagination-policy"].includes(entry.name)
      )
        continue;
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(name);
      else if (
        entry.isFile() &&
        /\.(?:ts|tsx|mjs|css|json|html|md)$/.test(name)
      ) {
        if (
          Object.keys(original).some(
            (file) => name === `packages/react/src/contracts/${file}`,
          )
        )
          continue;
        files[name] = digest(await readFile(join(root, name)));
      }
    }
  }
  for (const path of ["packages/react/src", "packages/heroui/src", "tests"])
    await walk(path);
  for (const file of [
    "package.json",
    "packages/react/package.json",
    "packages/heroui/package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "vitest.config.ts",
    "tsconfig.base.json",
    "biome.json",
  ]) {
    files[file] = digest(await readFile(join(root, file)));
  }
  return Object.fromEntries(
    Object.entries(files).sort(([a], [b]) => a.localeCompare(b)),
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = join(own, ".artifacts/pre-change");
  if (process.argv[2] === "--before") {
    assert.deepEqual(
      await four(),
      original,
      "STOP: allocated starting source differs from plan",
    );
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, "protected.json"),
      JSON.stringify(await snapshot(), null, 2),
      { flag: "wx" },
    );
    await writeFile(
      join(directory, "original-four.json"),
      JSON.stringify(original, null, 2),
      { flag: "wx" },
    );
  } else if (process.argv[2] === "--after") {
    const before = JSON.parse(
      await readFile(join(directory, "protected.json"), "utf8"),
    );
    assert.deepEqual(
      await snapshot(),
      before,
      "Excluded source/test/config/manifest changed",
    );
    const goldenHash = (
      await readFile(join(directory, "baselines.sha256"), "utf8")
    ).trim();
    assert.equal(
      digest(await readFile(join(own, "baselines.json"))),
      goldenHash,
      "Never rebase old paged expectations",
    );
    await writeFile(
      join(own, ".artifacts/outputs.json"),
      JSON.stringify(
        {
          four: await four(),
          protectedFiles: Object.keys(before).length,
          protectedUnchanged: true,
          baselineSha256: goldenHash,
        },
        null,
        2,
      ),
    );
    console.log(
      `${Object.keys(before).length} protected inputs and frozen pre-change expectations unchanged`,
    );
  } else throw new Error("Use --before or --after");
}
