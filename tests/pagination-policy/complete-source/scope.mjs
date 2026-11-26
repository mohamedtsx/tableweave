import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const initial = Object.fromEntries(
  Object.entries({
    "tanstack/types":
      "7cca21e7ed8c55760e07dde869bcae40320047634542374341833476e3da34a9",
    "tanstack/adapter":
      "48497c6bfc342824908648f188100314c6ca40eb36a781dc7b571730a1f657e6",
    "tanstack/boundary":
      "0ec21341bb9a82c8ffdb34fe8eefc6fb2a53f09a453912bf6a21d81dd46bfcb6",
    "presentation/types":
      "35b8ceae8cafdb2e9c60e6e85c30f1deabd4d3bdd266a67d579f582063dcdbfe",
    "presentation/binding":
      "3a67e13294fba491abc128d33e621fdac97d975579fb93bbee919aa45f18ecbe",
    "presentation/project":
      "30eb2060454eaa38e0200f9ba4f31bc54b2b29ff29fbf841569df3bbcac666e1",
    "presentation/masked":
      "f813ccc033722c41f0840a3821ab914c52188cc67a6b54fc76088c59d4b89b14",
    "presentation/authority":
      "7b50a3b037c7c38338228605874a69bdd830be85579a84b2ee0a076894c09b46",
  }).map(([path, value]) => [`packages/react/src/${path}.ts`, value]),
);
const art = join(own, ".artifacts");
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(art, { recursive: true });
  if (process.argv[2] === "--before") {
    const previous = JSON.parse(
      await readFile(
        join(
          root,
          "tests/pagination-policy/resource-extent/.artifacts/before-source105.json",
        ),
        "utf8",
      ),
    );
    const map = {};
    for (const [path, meta] of Object.entries(previous))
      map[path] = {
        mode: meta.mode,
        sha256: hash(await readFile(join(root, path))),
      };
    assert.equal(Object.keys(map).length, 105);
    assert.equal(
      hash(`${JSON.stringify(map, null, 2)}\n`),
      "3327ca40ba02be4f56534e4b00414fd4836362ec570e15103c97cb606b3cf6fe",
    );
    for (const [path, expected] of Object.entries(initial)) {
      assert.equal(map[path].sha256, expected, path);
      await writeFile(
        join(art, `original-${path.replaceAll("/", "_")}`),
        await readFile(join(root, path)),
        { flag: "wx" },
      );
    }
    await writeFile(
      join(art, "before-source105.json"),
      `${JSON.stringify(map, null, 2)}\n`,
      { flag: "wx" },
    );
    const protect = Object.fromEntries(
      Object.entries(map).filter(([path]) => !Object.hasOwn(initial, path)),
    );
    assert.equal(Object.keys(protect).length, 97);
    await writeFile(
      join(art, "protected-source97.json"),
      `${JSON.stringify(protect, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      "Initial8 and canonical3327ca40… source105 verified; immutable preimages and separate protected97 saved. No legacy runtime capture executed.",
    );
  } else if (process.argv[2] === "--after") {
    const fixturePath = "tests/controls/core/authority-mask-review.test.ts";
    const fixtureBefore = await readFile(
      join(art, "original-authority-mask-review.test.ts"),
      "utf8",
    );
    const fixtureOriginal = JSON.parse(
      await readFile(join(art, "original-fixture.json"), "utf8"),
    );
    assert.equal(hash(fixtureBefore), fixtureOriginal.sha256);
    const marker =
      "  const expected: ControlsPresentation<typeof schema, RecordRow> = {\n";
    assert(fixtureBefore.includes(marker));
    assert.equal(
      await readFile(join(root, fixturePath), "utf8"),
      fixtureBefore.replace(marker, `${marker}    paginationEnabled: true,\n`),
      "Only allocated literal fixture insertion is allowed",
    );
    const protect = JSON.parse(
      await readFile(join(art, "protected-source97.json"), "utf8"),
    );
    for (const [path, meta] of Object.entries(protect))
      assert.equal(hash(await readFile(join(root, path))), meta.sha256, path);
    const paths = [
      fixturePath,
      ...Object.keys(initial),
      ...(await readdir(own, { withFileTypes: true }))
        .filter((e) => e.isFile())
        .map((e) => `tests/pagination-policy/complete-source/${e.name}`),
    ].sort();
    const inputs = Object.fromEntries(
      await Promise.all(
        paths.map(async (path) => [
          path,
          hash(await readFile(join(root, path))),
        ]),
      ),
    );
    const handoff = {
      status: "PROVISIONAL — not independently verified or approved",
      inputs,
      aggregate: hash(`${JSON.stringify(inputs, null, 2)}\n`),
      protectedSources: 97,
      protectedUnchanged: true,
      noGeneratedOutputManifest: true,
      fixtureExactOneInsertion: true,
      lightChecks: {
        packageTS6: "package-light-final.log",
        fixturesTS6: "fixtures-light-final.log",
        syntax: "syntax-final.log",
        biome: "biome-final.log",
      },
      fullVerification:
        "DEFERRED: no U4 unit, preimage replay, TS5.9/emitted/negative, browser/SSR/packed or independent review pass claimed",
    };
    await writeFile(
      join(art, "handoff.json"),
      `${JSON.stringify(handoff, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ...handoff, inputs: paths.length }, null, 2));
  } else throw new Error("Use --before or --after");
}
