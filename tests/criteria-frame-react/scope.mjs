import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../..");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const producer = "packages/react/src/presentation/criteria-frame.ts",
  added = "packages/react/src/presentation/criteria-frame-react.ts",
  art = join(own, ".artifacts");
const mainSource = "packages/react/src/resource/adapter.ts";
const mainBefore =
  "36df1cc7ca0304140a2d983be9e84c577322956b6e211e6a9697b19f711261f4";
const mainAfter =
  "7ce69208472b815420ff1688016375c6633fdb9626a6ef8b055b42d6fa3405d2";
async function files(directory, skip = []) {
  const paths = [];
  for (const entry of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    if (skip.includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (resolve(root, path) === own) continue;
    if (entry.isDirectory()) paths.push(...(await files(path, skip)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}
async function sources() {
  const map = {};
  for (const path of [
    ...(await files("packages/react/src")),
    ...(await files("packages/heroui/src")),
  ].sort()) {
    const info = await stat(join(root, path));
    map[path] = {
      mode: info.mode & 0o111 ? "100755" : "100644",
      sha256: hash(await readFile(join(root, path))),
    };
  }
  return map;
}
async function inputs() {
  const paths = [
    ...(await files("tests", [".artifacts", "node_modules", "dist"])),
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "tsconfig.base.json",
    "biome.json",
    "vitest.config.ts",
    "playwright.config.ts",
    "packages/react/package.json",
    "packages/heroui/package.json",
    "packages/react/tsconfig.json",
    "packages/heroui/tsconfig.json",
    ...[
      "handoff.json",
      "before-source109.json",
      "protected-source104.json",
      "blocked-handoff.json",
    ].map((name) => `tests/criteria-frame/.artifacts/${name}`),
  ].sort();
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [path, hash(await readFile(join(root, path)))]),
    ),
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(art, { recursive: true });
  if (process.argv[2] === "--before") {
    const map = await sources();
    assert.equal(Object.keys(map).length, 117);
    assert(!Object.hasOwn(map, added));
    await writeFile(
      join(art, "before-source117.json"),
      `${JSON.stringify(map, null, 2)}\n`,
      { flag: "wx" },
    );
    await writeFile(
      join(art, "protected-source116.json"),
      `${JSON.stringify(Object.fromEntries(Object.entries(map).filter(([path]) => path !== producer)), null, 2)}\n`,
      { flag: "wx" },
    );
    await writeFile(
      join(art, "original-criteria-frame.ts"),
      await readFile(join(root, producer)),
      { flag: "wx" },
    );
    await writeFile(
      join(art, "before-inputs.json"),
      `${JSON.stringify(await inputs(), null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      JSON.stringify(
        {
          sources: 117,
          original: map[producer],
          aggregate: hash(`${JSON.stringify(map, null, 2)}\n`),
        },
        null,
        2,
      ),
    );
  } else if (process.argv[2] === "--main-identity") {
    const original = JSON.parse(
      await readFile(join(art, "protected-source116.json"), "utf8"),
    );
    assert.equal(original[mainSource].sha256, mainBefore);
    assert.equal(
      hash(
        await readFile(
          "/tmp/opencode/wp09-requestless-resource-identity.before.ts",
        ),
      ),
      mainBefore,
    );
    assert.equal(hash(await readFile(join(root, mainSource))), mainAfter);
    const subset = Object.fromEntries(
      Object.entries(original).filter(([path]) => path !== mainSource),
    );
    assert.equal(Object.keys(subset).length, 115);
    await writeFile(
      join(art, "protected-source115.json"),
      `${JSON.stringify(subset, null, 2)}\n`,
      { flag: "wx" },
    );
    await writeFile(
      join(art, "blocked-handoff.json"),
      await readFile(join(art, "handoff.json")),
      { flag: "wx" },
    );
    await writeFile(
      join(art, "main-identity-delta.json"),
      `${JSON.stringify({ owner: "main", path: mainSource, before: mainBefore, after: mainAfter, preimage: "/tmp/opencode/wp09-requestless-resource-identity.before.ts", originalMapUnchanged: true }, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      "Derived115 protected sources from historical116; main-owned exact preimage/current hashes match.",
    );
  } else if (process.argv[2] === "--after") {
    const protectedMap = JSON.parse(
        await readFile(join(art, "protected-source115.json"), "utf8"),
      ),
      current = await sources();
    const original = JSON.parse(
      await readFile(join(art, "protected-source116.json"), "utf8"),
    );
    assert.deepEqual(
      protectedMap,
      Object.fromEntries(
        Object.entries(original).filter(([path]) => path !== mainSource),
      ),
    );
    assert.equal(original[mainSource].sha256, mainBefore);
    assert.equal(current[mainSource].sha256, mainAfter);
    for (const [path, value] of Object.entries(protectedMap))
      assert.deepEqual(current[path], value, path);
    assert.equal(Object.keys(current).length, 118);
    assert.deepEqual(
      await inputs(),
      JSON.parse(await readFile(join(art, "before-inputs.json"), "utf8")),
    );
    const baseline = JSON.parse(
      await readFile(join(art, "before-source117.json"), "utf8"),
    );
    assert.equal(
      hash(await readFile(join(art, "original-criteria-frame.ts"))),
      baseline[producer].sha256,
    );
    assert.deepEqual(
      original,
      Object.fromEntries(
        Object.entries(baseline).filter(([path]) => path !== producer),
      ),
    );
    const blocked = JSON.parse(
      await readFile(join(art, "blocked-handoff.json"), "utf8"),
    );
    assert.equal(
      hash(await readFile(join(own, "BLOCKER.md"))),
      blocked.inputs["tests/criteria-frame-react/BLOCKER.md"],
    );
    assert.equal(
      hash(
        await readFile(
          "/tmp/opencode/wp09-requestless-resource-identity.before.ts",
        ),
      ),
      mainBefore,
    );
    const paths = [
      producer,
      added,
      ...(await readdir(own, { withFileTypes: true }))
        .filter((entry) => entry.isFile())
        .map((entry) => `tests/criteria-frame-react/${entry.name}`),
    ].sort();
    const map = Object.fromEntries(
      await Promise.all(
        paths.map(async (path) => [
          path,
          hash(await readFile(join(root, path))),
        ]),
      ),
    );
    const result = {
      status:
        "PROVISIONAL — implementation handoff only; final verification deferred",
      inputs: map,
      aggregate: hash(`${JSON.stringify(map, null, 2)}\n`),
      protectedSources: 115,
      mainOwnedIdentityDelta: {
        path: mainSource,
        before: mainBefore,
        after: mainAfter,
      },
      protectedOtherInputs: Object.keys(await inputs()).length,
      unchanged: true,
      outputManifest: false,
    };
    await writeFile(
      join(art, "handoff.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ...result, inputs: paths.length }, null, 2));
  } else throw new Error("Use --before/--after");
}
