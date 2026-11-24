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
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const cssPath = "packages/heroui/src/data-table/styles.css";
export const ownPath = relative(root, own);
export const artifacts = join(own, ".artifacts");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const originalSourcesSha =
  "92fc6e44fc160e6508740e06000ed1f21f9352d11ea6b85544fa5c92f35e1a89";
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

// Inventory every existing worktree file, including CSS, historical dist/assets,
// ignored fixture logs/maps/preimages and main's already-written child TASKS.
// Never enter dependency stores, reference checkouts or Git's own working data.
async function files(directory = "", excludeOwn = true) {
  const paths = [];
  for (const entry of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    if ([".git", ".repo", "node_modules"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (excludeOwn && path === ownPath) continue;
    if (entry.isDirectory()) paths.push(...(await files(path, excludeOwn)));
    else paths.push(path);
  }
  return paths.sort();
}
async function fingerprint(path) {
  const stat = await lstat(join(root, path));
  assert(stat.isFile() || stat.isSymbolicLink(), path);
  return {
    mode: stat.isSymbolicLink()
      ? "120000"
      : stat.mode & 0o100
        ? "100755"
        : "100644",
    sha256: hash(
      stat.isSymbolicLink()
        ? await readlink(join(root, path))
        : await readFile(join(root, path)),
    ),
  };
}
async function inventory(paths) {
  const entries = [];
  // Bound file handles and include all byte types, not only TS source text.
  for (const path of paths) entries.push([path, await fingerprint(path)]);
  return Object.fromEntries(entries);
}
async function sources() {
  return inventory(
    [
      ...(await files("packages/heroui/src")),
      ...(await files("packages/react/src")),
    ].sort(),
  );
}
function indexBytes() {
  return execFileSync("git", ["ls-files", "--stage", "-z"], {
    cwd: root,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(artifacts, { recursive: true });
  if (process.argv[2] === "--before") {
    const original = await readFile(
      "/tmp/opencode/wp09-before-shell-css-source130.json",
    );
    assert.equal(hash(original), originalSourcesSha);
    const expected = JSON.parse(original);
    assert.equal(Object.keys(expected).length, 130);
    assert.deepEqual(
      await sources(),
      expected,
      "All original130 files must match before any CSS addition",
    );
    const all = await inventory(await files());
    assert(!Object.hasOwn(all, cssPath), "Allocated CSS must be new");
    await writeFile(join(artifacts, "before-source130.json"), original, {
      flag: "wx",
    });
    await writeFile(join(artifacts, "before-inputs.json"), json(all), {
      flag: "wx",
    });
    await writeFile(join(artifacts, "before-index.bin"), indexBytes(), {
      flag: "wx",
    });
    console.log(
      json({
        status: "PASS before any source addition",
        source130Sha256: originalSourcesSha,
        sources: 130,
        protectedExistingInputs: Object.keys(all).length,
        modes:
          "Git file kind plus owner executable bit; not raw rw permission bits",
        taskBookkeepingIncluded: true,
      }),
    );
  } else if (process.argv[2] === "--after") {
    const original = await readFile(join(artifacts, "before-source130.json"));
    assert.equal(hash(original), originalSourcesSha);
    const expected = JSON.parse(original);
    const nowSources = await sources();
    assert.equal(Object.keys(nowSources).length, 131);
    assert.deepEqual(
      Object.keys(nowSources).sort(),
      [...Object.keys(expected), cssPath].sort(),
    );
    for (const [path, value] of Object.entries(expected))
      assert.deepEqual(nowSources[path], value, path);
    const all = await inventory(
      (await files()).filter((path) => path !== cssPath),
    );
    assert.deepEqual(
      all,
      JSON.parse(await readFile(join(artifacts, "before-inputs.json"), "utf8")),
      "No old worktree bytes/modes or extra out-of-lease files may change",
    );
    assert.deepEqual(
      indexBytes(),
      await readFile(join(artifacts, "before-index.bin")),
      "Git index unchanged",
    );
    const inputs = await inventory(
      [
        cssPath,
        ...(await files(ownPath, false)).filter(
          (path) => !path.includes("/.artifacts/"),
        ),
      ].sort(),
    );
    const handoff = {
      status:
        "implementation-ready PROVISIONAL; unimported shell layout CSS only",
      source130Sha256: originalSourcesSha,
      protectedExistingSources: 130,
      currentSourceFiles: 131,
      protectedExistingInputs: Object.keys(all).length,
      taskBookkeepingUnchanged: true,
      oldD2NeutralMapsLogsAssetsUnchanged: true,
      gitIndexUnchanged: true,
      inputCount: Object.keys(inputs).length,
      inputs,
      aggregate: hash(json(inputs)),
      activated: false,
      runtimeBrowserUnitOrVisualExecuted: false,
      independentApproval: false,
    };
    await writeFile(join(artifacts, "handoff.json"), json(handoff));
    console.log(json({ ...handoff, inputs: Object.keys(inputs) }));
  } else throw new Error("Use --before (once) or --after");
}
