import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const own = "tests/data-table/details-accessory/";
const existing = [
  "packages/heroui/src/filters/criteria-commit-core.ts",
  ...[
    "types.ts",
    "use-details-session.ts",
    "session-identity.ts",
    "details-shell.tsx",
    "identity.ts",
  ].map((n) => `packages/heroui/src/details/${n}`),
];
const additions = [
  "packages/heroui/src/details/committed-details.ts",
  ...["details-binding.ts", "details-provider.tsx", "details-trigger.tsx"].map(
    (n) => `packages/heroui/src/data-table/${n}`,
  ),
];
const sha = (b) => createHash("sha256").update(b).digest("hex");
const encode = (v) => `${JSON.stringify(v, null, 2)}\n`;
async function inventory() {
  const result = [];
  async function walk(dir) {
    for (const entry of await readdir(root + dir, { withFileTypes: true })) {
      if ([".git", ".repo", "node_modules"].includes(entry.name)) continue;
      const path = dir + entry.name;
      if (`${path}/` === own) continue;
      if (entry.isDirectory()) await walk(`${path}/`);
      else {
        const stat = await lstat(root + path);
        assert.ok(stat.isFile(), `Unexpected link or special file: ${path}`);
        result.push([
          path,
          {
            mode: stat.mode.toString(8),
            sha256: sha(await readFile(root + path)),
          },
        ]);
      }
    }
  }
  await walk("");
  return Object.fromEntries(result.sort(([a], [b]) => a.localeCompare(b)));
}
const current = await inventory();
if (process.argv[2] === "snapshot") {
  const sourceBytes = await readFile(
    "/tmp/opencode/wp09-after-s1-d1-source126.json",
  );
  assert.equal(
    sha(sourceBytes),
    "4a956137a365746d964c084a161884853650138c36e1aebe6a586d178345b731",
  );
  const source = JSON.parse(sourceBytes);
  assert.equal(Object.keys(source).length, 126);
  for (const [path, value] of Object.entries(source)) {
    assert.equal(current[path]?.sha256, value.sha256, path);
    // Main records Git executable modes; preserve actual checkout permissions separately.
    assert.equal(
      Number.parseInt(current[path].mode, 8) & 0o111 ? "100755" : "100644",
      value.mode,
      path,
    );
  }
  await writeFile(
    new URL("source126-before.json", import.meta.url),
    sourceBytes,
    { flag: "wx" },
  );
  const files = Object.fromEntries(
    Object.entries(current).filter(([p]) => !existing.includes(p)),
  );
  const sources = Object.fromEntries(
    Object.keys(source)
      .filter((p) => !existing.includes(p))
      .map((p) => [p, current[p]]),
  );
  assert.equal(Object.keys(sources).length, 120);
  await writeFile(
    new URL("protected-before.json", import.meta.url),
    encode(files),
    { flag: "wx" },
  );
  await writeFile(
    new URL("protected-sources-before.json", import.meta.url),
    encode(sources),
    { flag: "wx" },
  );
  for (const path of existing) {
    const target = new URL(`preimages/${path}`, import.meta.url);
    await mkdir(new URL("./", target), { recursive: true });
    await writeFile(target, await readFile(root + path), { flag: "wx" });
  }
  const result = {
    base: "76c3823 (main supplied; no Git command)",
    source126: sha(sourceBytes),
    protectedFiles: Object.keys(files).length,
    protectedFilesAggregate: sha(encode(files)),
    protectedSources: 120,
    protectedSourcesAggregate: sha(encode(sources)),
    existing,
    additions,
  };
  await writeFile(new URL("baseline.json", import.meta.url), encode(result), {
    flag: "wx",
  });
  process.stdout.write(encode(result));
} else {
  const before = JSON.parse(
    await readFile(new URL("protected-before.json", import.meta.url), "utf8"),
  );
  const changed = Object.keys(before).filter(
    (p) => JSON.stringify(before[p]) !== JSON.stringify(current[p]),
  );
  const extra = Object.keys(current).filter(
    (p) => !(p in before) && !existing.includes(p) && !additions.includes(p),
  );
  const result = { protectedFiles: Object.keys(before).length, changed, extra };
  await mkdir(new URL(".artifacts/", import.meta.url), { recursive: true });
  await writeFile(
    new URL(".artifacts/scope.json", import.meta.url),
    encode(result),
  );
  process.stdout.write(encode(result));
  if (changed.length || extra.length) process.exitCode = 1;
}
