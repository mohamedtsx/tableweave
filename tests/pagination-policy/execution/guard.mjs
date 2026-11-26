import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const source = "packages/react/src/contracts/execution.ts";
export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export async function snapshot() {
  const files = {};
  async function walk(relative) {
    for (const entry of await readdir(join(root, relative), {
      withFileTypes: true,
    })) {
      if (
        entry.name.startsWith(".") ||
        ["node_modules", "dist"].includes(entry.name)
      )
        continue;
      const name = `${relative}/${entry.name}`;
      if (name === source || resolve(root, name) === own) continue;
      if (entry.isDirectory()) await walk(name);
      else if (
        entry.isFile() &&
        /\.(?:ts|tsx|mjs|css|json|html|md)$/.test(name)
      )
        files[name] = digest(await readFile(join(root, name)));
    }
  }
  for (const directory of [
    "packages/react/src",
    "packages/heroui/src",
    "tests",
  ])
    await walk(directory);
  for (const file of [
    "package.json",
    "packages/react/package.json",
    "packages/heroui/package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "vitest.config.ts",
    "tsconfig.base.json",
    "biome.json",
  ])
    files[file] = digest(await readFile(join(root, file)));
  return Object.fromEntries(
    Object.entries(files).sort(([a], [b]) => a.localeCompare(b)),
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const artifacts = join(own, ".artifacts");
  await mkdir(artifacts, { recursive: true });
  const previous = JSON.parse(
    await readFile(
      join(root, "tests/pagination-policy/contracts/.artifacts/handoff.json"),
      "utf8",
    ),
  );
  assert.equal(
    previous.inputAggregateSha256,
    "36676cb883cda5276a2a63194988bacd89d38981ff49e16b8690daf8d1111086",
  );
  assert.equal(
    digest(`${JSON.stringify(previous.inputSha256, null, 2)}\n`),
    previous.inputAggregateSha256,
    "Approved prerequisite input map must match its fixed aggregate",
  );
  for (const [file, hash] of Object.entries(previous.inputSha256))
    assert.equal(
      digest(await readFile(join(root, file))),
      hash,
      `Approved prerequisite changed: ${file}`,
    );
  if (process.argv[2] === "--before") {
    await writeFile(
      join(artifacts, "protected-before.json"),
      JSON.stringify(await snapshot(), null, 2),
      { flag: "wx" },
    );
  } else if (process.argv[2] === "--after") {
    const before = JSON.parse(
      await readFile(join(artifacts, "protected-before.json"), "utf8"),
    );
    assert.deepEqual(
      await snapshot(),
      before,
      "Excluded source/tests/config/manifests changed",
    );
    const output = {
      protectedFiles: Object.keys(before).length,
      unchanged: true,
      approvedPrerequisiteAggregate: previous.inputAggregateSha256,
      sourceSha256: digest(await readFile(join(root, source))),
    };
    await writeFile(
      join(artifacts, "guard.json"),
      JSON.stringify(output, null, 2),
    );
    console.log(
      `${output.protectedFiles} protected inputs and approved prerequisite14 bytes unchanged`,
    );
  } else throw new Error("Use --before or --after");
}
