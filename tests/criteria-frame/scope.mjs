import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../..");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const existing = Object.fromEntries(
  Object.entries({
    "tanstack/adapter":
      "2cfaab8971f46e90ac4e9eac4aaf57356f713ea30c66b2416b3da09e25584a69",
    "tanstack/boundary":
      "369866d0a135a81cc183599012d23ef26f5d871b77a858da4338ed9778354707",
    "presentation/types":
      "021b6fc6352d305b1bbe22b462cbbd00b3b3f706059a3fca90283aba7262afec",
    "presentation/authority":
      "bab10984ac8b20e8854ef64505f7da594f3225e57784d46d1847db6c26b394f6",
    "presentation/project":
      "216a85186fccf100da82821c2daa9089f8696a27b4b576d5f542324ca2ec957e",
  }).map(([path, value]) => [`packages/react/src/${path}.ts`, value]),
);
const art = join(own, ".artifacts");
async function otherInputs() {
  const map = {};
  async function walk(directory) {
    for (const item of await readdir(join(root, directory), {
      withFileTypes: true,
    })) {
      if ([".artifacts", "node_modules", "dist"].includes(item.name)) continue;
      const path = join(directory, item.name);
      if (resolve(root, path) === own) continue;
      if (item.isDirectory()) await walk(path);
      else if (item.isFile())
        map[path] = hash(await readFile(join(root, path)));
    }
  }
  await walk("tests");
  for (const path of [
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
    "packages/heroui/tsconfig.json",
  ])
    map[path] = hash(await readFile(join(root, path)));
  return map;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(art, { recursive: true });
  if (process.argv[2] === "--before") {
    const bytes = await readFile(
      "/tmp/opencode/wp09-before-criteria-frame-source109.json",
    );
    assert.equal(
      hash(bytes),
      "048c088c1905e64e1cdad3c1a7ee0d96e1452f6b422da64c0264b6dbe3f89fde",
    );
    const map = JSON.parse(bytes);
    assert.equal(Object.keys(map).length, 109);
    for (const [path, info] of Object.entries(map))
      assert.equal(hash(await readFile(join(root, path))), info.sha256, path);
    for (const [path, expected] of Object.entries(existing)) {
      assert.equal(map[path].sha256, expected);
      await writeFile(
        join(art, `original-${path.replaceAll("/", "_")}`),
        await readFile(join(root, path)),
        { flag: "wx" },
      );
    }
    await writeFile(join(art, "before-source109.json"), bytes, { flag: "wx" });
    const protectedSources = Object.fromEntries(
      Object.entries(map).filter(([path]) => !Object.hasOwn(existing, path)),
    );
    assert.equal(Object.keys(protectedSources).length, 104);
    await writeFile(
      join(art, "protected-source104.json"),
      JSON.stringify(protectedSources, null, 2),
      { flag: "wx" },
    );
    await writeFile(
      join(art, "other-inputs.json"),
      JSON.stringify(await otherInputs(), null, 2),
      { flag: "wx" },
    );
    console.log(
      "Canonical109/initial5 verified;104 protected sources and existing static tests/config saved. No output fingerprinting.",
    );
  } else if (process.argv[2] === "--after") {
    const protect = JSON.parse(
      await readFile(join(art, "protected-source104.json"), "utf8"),
    );
    for (const [path, info] of Object.entries(protect))
      assert.equal(hash(await readFile(join(root, path))), info.sha256, path);
    assert.deepEqual(
      await otherInputs(),
      JSON.parse(await readFile(join(art, "other-inputs.json"), "utf8")),
    );
    assert.equal(
      hash(await readFile(join(art, "before-source109.json"))),
      "048c088c1905e64e1cdad3c1a7ee0d96e1452f6b422da64c0264b6dbe3f89fde",
    );
    for (const [path, expected] of Object.entries(existing))
      assert.equal(
        hash(
          await readFile(join(art, `original-${path.replaceAll("/", "_")}`)),
        ),
        expected,
      );
    const blocked = JSON.parse(
      await readFile(join(art, "blocked-handoff.json"), "utf8"),
    );
    assert.equal(
      hash(await readFile(join(own, "BLOCKER.md"))),
      blocked.inputs["tests/criteria-frame/BLOCKER.md"],
    );
    assert.equal(
      hash(
        await readFile(join(art, "original-outer-wrapper-obligation.test.ts")),
      ),
      blocked.inputs["tests/criteria-frame/sort-resolver-boundary.test.ts"],
    );
    const paths = [
      ...Object.keys(existing),
      "packages/react/src/tanstack/sort.ts",
      ...["criteria-frame", "criteria-callbacks"].map(
        (name) => `packages/react/src/presentation/${name}.ts`,
      ),
      ...(await readdir(own, { withFileTypes: true }))
        .filter((item) => item.isFile())
        .map((item) => `tests/criteria-frame/${item.name}`),
    ].sort();
    const inputs = Object.fromEntries(
      await Promise.all(
        paths.map(async (path) => [
          path,
          hash(await readFile(join(root, path))),
        ]),
      ),
    );
    const result = {
      status:
        "PROVISIONAL — F1/helper implementation handoff, not independently verified or approved",
      inputs,
      aggregate: hash(`${JSON.stringify(inputs, null, 2)}\n`),
      protectedSources: 104,
      otherProtected: Object.keys(await otherInputs()).length,
      unchanged: true,
      historicalBlockerAndOriginalObligationUnchanged: true,
      outputManifest: false,
      deferred: [
        "all runtime suites and helper positives",
        "dual compiler/emitted/negative matrices",
        "runtime import graph",
        "browser/SSR/packed",
        "independent review and approval",
      ],
    };
    await writeFile(
      join(art, "handoff.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ...result, inputs: paths.length }, null, 2));
  } else throw new Error("Use --before/--after");
}
