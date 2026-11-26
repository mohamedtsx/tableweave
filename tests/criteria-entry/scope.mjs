import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  readlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../..");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const artifacts = join(own, ".artifacts");
const manifest = "packages/react/package.json";
const entry = "packages/react/src/criteria/index.ts";
const baselineSha =
  "52a14c39ca28b51004a2316bf200ab9bd64b5fca2a19522ccd31a92f47f0885b";
function index() {
  // Read-only index inventory: authoritative Git modes, not permission-bit guesses.
  const bytes = execFileSync("git", ["ls-files", "--stage", "-z"], {
    cwd: root,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
  });
  return Object.fromEntries(
    bytes
      .toString("utf8")
      .split("\0")
      .filter(Boolean)
      .map((value) => {
        const match = /^(\d{6}) ([a-f0-9]+) (\d)\t([\s\S]+)$/.exec(value);
        assert(match && match[3] === "0", "Unmerged/invalid index entry");
        return [match[4], { mode: match[1], objectId: match[2] }];
      }),
  );
}
async function fingerprint(path, mode) {
  assert(!path.startsWith(".repo/"), "Read-only .repo must not be inventoried");
  const value = await lstat(join(root, path));
  assert(
    ["100644", "100755", "120000"].includes(mode),
    `Unsupported Git mode ${mode}: ${path}`,
  );
  assert.equal(value.isSymbolicLink(), mode === "120000", path);
  if (!value.isSymbolicLink()) assert(value.isFile(), path);
  return {
    mode,
    sha256: hash(
      value.isSymbolicLink()
        ? await readlink(join(root, path))
        : await readFile(join(root, path)),
    ),
  };
}
async function sourcePaths(directory) {
  const paths = [];
  for (const value of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    const path = join(directory, value.name);
    if (value.isDirectory()) paths.push(...(await sourcePaths(path)));
    else paths.push(path);
  }
  return paths.sort();
}
async function protectedInputs(entries) {
  const values = [];
  for (const [path, value] of Object.entries(entries)) {
    if (
      path === manifest ||
      path === "TASKS.md" ||
      path.startsWith("tests/criteria-entry/")
    )
      continue;
    values.push([path, await fingerprint(path, value.mode)]);
  }
  return Object.fromEntries(values);
}
export function assertManifest(beforeBytes, afterBytes) {
  const before = JSON.parse(beforeBytes),
    after = JSON.parse(afterBytes);
  const addition = {
    types: "./dist/criteria/index.d.ts",
    import: "./dist/criteria/index.js",
  };
  assert.deepEqual(after, {
    ...before,
    exports: { ...before.exports, "./criteria": addition },
  });
  assert.deepEqual(Object.keys(after), Object.keys(before));
  assert.deepEqual(Object.keys(after.exports), [
    ...Object.keys(before.exports),
    "./criteria",
  ]);
  assert.deepEqual(Object.keys(after.exports["./criteria"]), [
    "types",
    "import",
  ]);
  const expectedBytes = beforeBytes.replace(
    '"import": "./dist/filters/index.js"\n    }',
    '"import": "./dist/filters/index.js"\n    },\n    "./criteria": {\n      "types": "./dist/criteria/index.d.ts",\n      "import": "./dist/criteria/index.js"\n    }',
  );
  assert.equal(
    afterBytes,
    expectedBytes,
    "Manifest must be the exact additive hunk only",
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(artifacts, { recursive: true });
  const entries = index();
  if (process.argv[2] === "--before") {
    const bytes = await readFile(
      "/tmp/opencode/wp09-after-s2-date-locales-source129.json",
    );
    assert.equal(hash(bytes), baselineSha);
    const baseline = JSON.parse(bytes);
    assert.equal(Object.keys(baseline).length, 129);
    assert.deepEqual(
      [
        ...(await sourcePaths("packages/react/src")),
        ...(await sourcePaths("packages/heroui/src")),
      ].sort(),
      Object.keys(baseline).sort(),
    );
    for (const [path, value] of Object.entries(baseline)) {
      assert.equal(entries[path]?.mode, value.mode, path);
      assert.deepEqual(
        await fingerprint(path, entries[path].mode),
        value,
        path,
      );
    }
    await writeFile(join(artifacts, "before-source129.json"), bytes, {
      flag: "wx",
    });
    await writeFile(
      join(artifacts, "package.before.json"),
      await readFile(join(root, manifest)),
      { flag: "wx" },
    );
    await writeFile(
      join(artifacts, "before-index.json"),
      `${JSON.stringify(entries, null, 2)}\n`,
      { flag: "wx" },
    );
    const inputs = await protectedInputs(entries);
    await writeFile(
      join(artifacts, "before-inputs.json"),
      `${JSON.stringify(inputs, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      JSON.stringify(
        {
          protectedSources: 129,
          baselineSha,
          manifestBefore: hash(await readFile(join(root, manifest))),
          protectedTrackedInputs: Object.keys(inputs).length,
          modeSource: "git ls-files --stage -z (read-only)",
        },
        null,
        2,
      ),
    );
  } else if (process.argv[2] === "--after") {
    const bytes = await readFile(join(artifacts, "before-source129.json"));
    assert.equal(hash(bytes), baselineSha);
    const baseline = JSON.parse(bytes),
      beforeIndex = JSON.parse(
        await readFile(join(artifacts, "before-index.json"), "utf8"),
      );
    assert.deepEqual(
      entries,
      beforeIndex,
      "Worker must not change the Git index",
    );
    for (const [path, value] of Object.entries(baseline))
      assert.deepEqual(
        await fingerprint(path, entries[path].mode),
        value,
        path,
      );
    assert.deepEqual(
      [
        ...(await sourcePaths("packages/react/src")),
        ...(await sourcePaths("packages/heroui/src")),
      ].sort(),
      [...Object.keys(baseline), entry].sort(),
    );
    const before = await readFile(
        join(artifacts, "package.before.json"),
        "utf8",
      ),
      after = await readFile(join(root, manifest), "utf8");
    assertManifest(before, after);
    const inputs = await protectedInputs(entries);
    assert.deepEqual(
      inputs,
      JSON.parse(await readFile(join(artifacts, "before-inputs.json"), "utf8")),
    );
    const ownFiles = (await readdir(own, { withFileTypes: true }))
      .filter((value) => value.isFile())
      .map((value) => `tests/criteria-entry/${value.name}`);
    const paths = [manifest, entry, ...ownFiles].sort(),
      handoff = Object.fromEntries(
        await Promise.all(
          paths.map(async (path) => [
            path,
            hash(await readFile(join(root, path))),
          ]),
        ),
      );
    const result = {
      status: "implementation-ready PROVISIONAL; source-only light evidence",
      inputs: handoff,
      aggregate: hash(`${JSON.stringify(handoff, null, 2)}\n`),
      protectedSources: 129,
      protectedTrackedInputs: Object.keys(inputs).length,
      exactAdditiveManifestOnly: true,
      historicalMapsAndAssetsUnchanged: true,
      currentSourceFiles: 130,
      gitIndexUnchanged: true,
      runtimeImportExecuted: false,
      genuineArchiveProof: false,
      outputIdentityRegistered: false,
    };
    await writeFile(
      join(artifacts, "handoff.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ...result, inputs: paths.length }, null, 2));
  } else throw new Error("Use --before/--after");
}
