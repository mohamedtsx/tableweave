import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  readlink,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const artifacts = join(own, ".artifacts");
const existing = {
  "packages/react/src/table/types.ts":
    "60c56b51b7e37a17b13dab8404a89792cf8415715e3b50b68478b910a72aa4de",
  "packages/react/src/presentation/criteria-frame.ts":
    "4d785e345657d7cbe78aa6ce1dddc1662b949427823282378a83a803cf951d3f",
  "packages/react/src/presentation/criteria-frame-react.ts":
    "ed10694653cd84a7fe5df791eb47002ceaff670933e6e7cd90caca98a6b1bce6",
};
const added = [
  "packages/react/src/table/use-data-table.ts",
  "packages/react/src/table/recovery.ts",
];
const canonical = "/tmp/opencode/wp09-before-facade-hook-source119.json";
const canonicalHash =
  "1eb525a870c29deebfa7c7db840ed8044b664d26c782b8369e14c18cb0813420";
async function paths(directory, skip = []) {
  const result = [];
  for (const entry of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    if (skip.includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (resolve(root, path) === own) continue;
    if (entry.isDirectory()) result.push(...(await paths(path, skip)));
    else if (entry.isFile() || entry.isSymbolicLink()) result.push(path);
  }
  return result.sort();
}
async function sources() {
  const result = {};
  for (const path of [
    ...(await paths("packages/react/src")),
    ...(await paths("packages/heroui/src")),
  ].sort())
    result[path] = {
      mode: (await stat(join(root, path))).mode & 0o111 ? "100755" : "100644",
      sha256: hash(await readFile(join(root, path))),
    };
  return result;
}
async function inputs() {
  const files = [
    ...(await paths("tests", ["node_modules", "dist"])),
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "biome.json",
    "tsconfig.base.json",
    "vitest.config.ts",
    "playwright.config.ts",
    ...["react", "heroui"].flatMap((pkg) =>
      ["package.json", "tsconfig.json", "tsconfig.build.json"].map(
        (file) => `packages/${pkg}/${file}`,
      ),
    ),
  ].sort();
  return Object.fromEntries(
    await Promise.all(
      files.map(async (path) => {
        let bytes;
        try {
          bytes = await readFile(join(root, path));
        } catch (error) {
          if (error.code !== "EISDIR") throw error;
          bytes = await readlink(join(root, path));
        }
        return [path, hash(bytes)];
      }),
    ),
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(artifacts, { recursive: true });
  if (process.argv[2] === "--before") {
    const bytes = await readFile(canonical);
    assert.equal(hash(bytes), canonicalHash);
    const baseline = JSON.parse(bytes);
    assert.equal(Object.keys(baseline).length, 119);
    assert.deepEqual(await sources(), baseline);
    for (const [path, sha] of Object.entries(existing))
      assert.equal(baseline[path].sha256, sha, path);
    await writeFile(join(artifacts, "before-source119.json"), bytes, {
      flag: "wx",
    });
    await writeFile(
      join(artifacts, "protected-source116.json"),
      `${JSON.stringify(Object.fromEntries(Object.entries(baseline).filter(([path]) => !Object.hasOwn(existing, path))), null, 2)}\n`,
      { flag: "wx" },
    );
    for (const path of Object.keys(existing))
      await writeFile(
        join(artifacts, `original-${path.split("/").at(-1)}`),
        await readFile(join(root, path)),
        { flag: "wx" },
      );
    const protectedInputs = await inputs();
    await writeFile(
      join(artifacts, "before-inputs.json"),
      `${JSON.stringify(protectedInputs, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      JSON.stringify(
        {
          sources: 119,
          protectedSources: 116,
          staticInputsIncludingHistoricalArtifacts:
            Object.keys(protectedInputs).length,
          aggregate: canonicalHash,
          initialHashes: existing,
        },
        null,
        2,
      ),
    );
  } else if (process.argv[2] === "--after") {
    const bytes = await readFile(join(artifacts, "before-source119.json"));
    assert.equal(hash(bytes), canonicalHash);
    const baseline = JSON.parse(bytes),
      protectedMap = JSON.parse(
        await readFile(join(artifacts, "protected-source116.json"), "utf8"),
      ),
      current = await sources();
    assert.deepEqual(
      protectedMap,
      Object.fromEntries(
        Object.entries(baseline).filter(
          ([path]) => !Object.hasOwn(existing, path),
        ),
      ),
    );
    for (const [path, value] of Object.entries(protectedMap))
      assert.deepEqual(current[path], value, path);
    assert.equal(
      current["packages/react/src/resource/adapter.ts"].sha256,
      "7ce69208472b815420ff1688016375c6633fdb9626a6ef8b055b42d6fa3405d2",
    );
    assert.deepEqual(
      Object.keys(current).sort(),
      [...Object.keys(baseline), ...added].sort(),
    );
    const protectedInputs = JSON.parse(
      await readFile(join(artifacts, "before-inputs.json"), "utf8"),
    );
    assert.deepEqual(await inputs(), protectedInputs);
    const files = [
      ...Object.keys(existing),
      ...added,
      ...(await readdir(own, { withFileTypes: true }))
        .filter((e) => e.isFile())
        .map((e) => `tests/table-facade/hook/${e.name}`),
    ].sort();
    const map = Object.fromEntries(
      await Promise.all(
        files.map(async (path) => [
          path,
          hash(await readFile(join(root, path))),
        ]),
      ),
    );
    const result = {
      status: "PROVISIONAL implementation handoff; final verification deferred",
      inputs: map,
      aggregate: hash(`${JSON.stringify(map, null, 2)}\n`),
      protectedSources: 116,
      protectedExistingInputsIncludingHistoricalArtifacts:
        Object.keys(protectedInputs).length,
      unchanged: true,
      outputIdentityRegistered: false,
    };
    await writeFile(
      join(artifacts, "handoff.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ...result, inputs: files.length }, null, 2));
  } else throw new Error("Use --before/--after");
}
