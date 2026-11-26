import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = "tests/criteria-facade-builder/";
const source = "packages/heroui/src/filters/criteria-builder-host.tsx";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalBytes = await readFile(
  "/tmp/opencode/wp09-before-shell-integration-source137.json",
);
const canonicalHash =
  "1c28d45fb16d137772cd96be3c3b800e96fbda7227bf105d4e3afa9118aee623";
assert.equal(digest(canonicalBytes), canonicalHash);
const canonical = JSON.parse(canonicalBytes);
assert.equal(Object.keys(canonical).length, 137);
assert.equal(
  canonical[source].sha256,
  "a6c141239024c44be1ef8fb38b040e9acb5f09d0354333996095546aa77b8fd3",
);

async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      [
        "node_modules",
        ".git",
        ".repo",
        ".artifacts",
        "dist",
        "build",
        "test-results",
        "playwright-report",
      ].includes(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name === ".npmrc"
    )
      continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (entry.isFile()) paths.push(relative(root, path));
  }
  return paths;
}
async function measure(path) {
  return {
    sha256: digest(await readFile(resolve(root, path))),
    mode: (await stat(resolve(root, path))).mode & 0o777,
  };
}
async function protectedFiles() {
  const paths = (await walk(root))
    .filter(
      (path) => path !== source && path !== "TASKS.md" && !path.startsWith(own),
    )
    .sort();
  return Object.fromEntries(
    await Promise.all(paths.map(async (path) => [path, await measure(path)])),
  );
}
const beforeFile = new URL("./before.json", import.meta.url);
if (process.argv[2] === "before") {
  for (const [path, expected] of Object.entries(canonical)) {
    const actual = await measure(path);
    assert.equal(actual.sha256, expected.sha256, path);
    assert.equal(
      actual.mode & 0o111 ? "100755" : "100644",
      expected.mode,
      path,
    );
  }
  await mkdir(new URL("./", import.meta.url), { recursive: true });
  await writeFile(
    new URL("./source-preimage.txt", import.meta.url),
    await readFile(resolve(root, source)),
    { flag: "wx" },
  );
  const before = {
    canonicalHash,
    suppliedRevision: "ba282fa (not Git-reverified)",
    source: await measure(source),
    exclusions: [source, own, "TASKS.md (main bookkeeping)"],
    protected: await protectedFiles(),
  };
  await writeFile(beforeFile, `${JSON.stringify(before, null, 2)}\n`, {
    flag: "wx",
  });
  console.log(
    `All137 source hashes/modes verified before production edits; ${Object.keys(before.protected).length} protected inputs captured; exact host preimage captured.`,
  );
} else {
  const before = JSON.parse(await readFile(beforeFile, "utf8"));
  assert.deepEqual(await protectedFiles(), before.protected);
  assert.equal(
    digest(await readFile(new URL("./source-preimage.txt", import.meta.url))),
    before.source.sha256,
  );
  assert.equal((await measure(source)).mode, before.source.mode);
  for (const [path, expected] of Object.entries(canonical)) {
    const actual = await measure(path);
    if (path !== source) assert.equal(actual.sha256, expected.sha256, path);
    assert.equal(
      actual.mode & 0o111 ? "100755" : "100644",
      expected.mode,
      path,
    );
  }
  console.log(
    `${Object.keys(before.protected).length} protected inputs / 136 protected sources / historical seals / host preimage and modes unchanged.`,
  );
}
