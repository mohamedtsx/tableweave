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
export const producer = "packages/heroui/src/data-table/details-provider.tsx";
export const preimage = join(own, "preimages/details-provider.before.tsx");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const artifacts = join(own, ".artifacts");
const sourceSha =
  "90f6528f6adcc061eeae0a6e47d81179ff4a018d6732d10110e34cead7f2c55d";
const producerSha =
  "aa8d59d31482fa8958039e827dc17f39e3aa361a6922b162e7c4b56be40d32a5";
function index() {
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
        const match = /^(\d{6}) ([a-f0-9]+) 0\t([\s\S]+)$/.exec(value);
        assert(match);
        return [match[3], { mode: match[1], objectId: match[2] }];
      }),
  );
}
async function files(directory, skip = []) {
  const paths = [];
  for (const value of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    if (skip.includes(value.name)) continue;
    const path = join(directory, value.name);
    if (resolve(root, path) === own) continue;
    if (value.isDirectory()) paths.push(...(await files(path, skip)));
    else paths.push(path);
  }
  return paths.sort();
}
async function fingerprint(path) {
  assert(!path.startsWith(".repo/"));
  const stat = await lstat(join(root, path));
  // Git file modes normalize rw/group/other permission bits. Never compare raw
  // 100664 to 100644; only symlink/file kind and the owner executable bit matter.
  const mode = stat.isSymbolicLink()
    ? "120000"
    : stat.mode & 0o100
      ? "100755"
      : "100644";
  assert(stat.isSymbolicLink() || stat.isFile(), path);
  return {
    mode,
    sha256: hash(
      stat.isSymbolicLink()
        ? await readlink(join(root, path))
        : await readFile(join(root, path)),
    ),
  };
}
async function sources() {
  return Object.fromEntries(
    await Promise.all(
      [
        ...(await files("packages/react/src")),
        ...(await files("packages/heroui/src")),
      ]
        .sort()
        .map(async (path) => [path, await fingerprint(path)]),
    ),
  );
}
async function inputs(entries) {
  const paths = new Set([
    ...Object.keys(entries),
    ...(await files("tests", ["node_modules"])),
  ]);
  return Object.fromEntries(
    await Promise.all(
      [...paths]
        .filter(
          (path) =>
            path !== producer &&
            path !== "TASKS.md" &&
            !path.startsWith("tests/details-neutral-label/"),
        )
        .sort()
        .map(async (path) => [path, await fingerprint(path)]),
    ),
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(artifacts, { recursive: true });
  const entries = index();
  if (process.argv[2] === "--before") {
    const bytes = await readFile(
      "/tmp/opencode/wp09-before-neutral-label-source130.json",
    );
    assert.equal(hash(bytes), sourceSha);
    const map = JSON.parse(bytes);
    assert.equal(Object.keys(map).length, 130);
    assert.equal(map[producer].sha256, producerSha);
    assert.deepEqual(await sources(), map);
    await writeFile(join(artifacts, "before-source130.json"), bytes, {
      flag: "wx",
    });
    const protected129 = Object.fromEntries(
      Object.entries(map).filter(([path]) => path !== producer),
    );
    await writeFile(
      join(artifacts, "protected-source129.json"),
      `${JSON.stringify(protected129, null, 2)}\n`,
      { flag: "wx" },
    );
    await mkdir(dirname(preimage), { recursive: true });
    await writeFile(preimage, await readFile(join(root, producer)), {
      flag: "wx",
    });
    await writeFile(
      join(artifacts, "before-index.json"),
      `${JSON.stringify(entries, null, 2)}\n`,
      { flag: "wx" },
    );
    const old = await inputs(entries);
    await writeFile(
      join(artifacts, "before-inputs.json"),
      `${JSON.stringify(old, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      JSON.stringify(
        {
          sourceSha,
          producerSha,
          protectedSources: 129,
          existingInputs: Object.keys(old).length,
        },
        null,
        2,
      ),
    );
  } else if (process.argv[2] === "--after") {
    const bytes = await readFile(join(artifacts, "before-source130.json"));
    assert.equal(hash(bytes), sourceSha);
    const original = JSON.parse(bytes),
      current = await sources();
    assert.deepEqual(Object.keys(current).sort(), Object.keys(original).sort());
    const expected = Object.fromEntries(
      Object.entries(original).filter(([path]) => path !== producer),
    );
    assert.deepEqual(
      JSON.parse(
        await readFile(join(artifacts, "protected-source129.json"), "utf8"),
      ),
      expected,
    );
    for (const [path, value] of Object.entries(expected))
      assert.deepEqual(current[path], value, path);
    assert.equal(hash(await readFile(preimage)), producerSha);
    assert.deepEqual(
      entries,
      JSON.parse(await readFile(join(artifacts, "before-index.json"), "utf8")),
    );
    const old = await inputs(entries);
    assert.deepEqual(
      old,
      JSON.parse(await readFile(join(artifacts, "before-inputs.json"), "utf8")),
    );
    const paths = [producer, ...(await files("tests/details-neutral-label"))]
      .filter((path) => !path.includes("/.artifacts/"))
      .sort();
    const inputMap = Object.fromEntries(
      await Promise.all(
        paths.map(async (path) => [
          path,
          hash(await readFile(join(root, path))),
        ]),
      ),
    );
    const result = {
      status:
        "implementation-ready PROVISIONAL; neutral presentation metadata only",
      inputs: inputMap,
      aggregate: hash(`${JSON.stringify(inputMap, null, 2)}\n`),
      protectedSources: 129,
      unchangedExistingInputs: Object.keys(old).length,
      originalProvider: producerSha,
      gitIndexUnchanged: true,
      historicalMapsUnchanged: true,
      runtimeReactSsrBrowserExecuted: false,
      independentApproval: false,
    };
    await writeFile(
      join(artifacts, "handoff.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ...result, inputs: paths.length }, null, 2));
  } else throw new Error("Use --before/--after");
}
