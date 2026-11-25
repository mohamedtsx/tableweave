import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  readlink,
  writeFile,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url)),
  own = "tests/data-table/shell/",
  out = own + ".artifacts/";
const existing = [
  "packages/heroui/src/table/types.ts",
  "packages/heroui/src/table/renderer-commit.ts",
  "packages/heroui/src/data-table/details-binding.ts",
  "packages/heroui/src/data-table/details-provider.tsx",
  "packages/heroui/src/data-table/details-trigger.tsx",
  "packages/heroui/src/localization/data-table.ts",
];
const additions = [
  "packages/heroui/src/data-table/data-table.tsx",
  "packages/heroui/src/data-table/host.tsx",
  "packages/heroui/src/data-table/state.tsx",
];
const sha = (b) => createHash("sha256").update(b).digest("hex"),
  json = (v) => `${JSON.stringify(v, null, 2)}\n`;
async function walk(dir = "") {
  const result = {};
  for (const e of await readdir(root + dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".repo"].includes(e.name)) continue;
    const path = dir + e.name;
    if (path + "/" === own) continue;
    if (e.isDirectory()) Object.assign(result, await walk(path + "/"));
    else {
      const s = await lstat(root + path);
      result[path] = {
        mode: s.mode.toString(8),
        sha256: sha(
          s.isSymbolicLink()
            ? await readlink(root + path)
            : await readFile(root + path),
        ),
      };
    }
  }
  return result;
}
await mkdir(root + out, { recursive: true });
const now = await walk();
if (process.argv[2] === "before") {
  const bytes = await readFile(
    "/tmp/opencode/wp09-before-shell-integration-source137.json",
  );
  assert.equal(
    sha(bytes),
    "1c28d45fb16d137772cd96be3c3b800e96fbda7227bf105d4e3afa9118aee623",
  );
  const canonical = JSON.parse(bytes);
  assert.equal(Object.keys(canonical).length, 137);
  for (const [p, v] of Object.entries(canonical)) {
    assert.equal(now[p]?.sha256, v.sha256, p);
    assert.equal(
      parseInt(now[p].mode, 8) & 0o111 ? "100755" : "100644",
      v.mode,
      p,
    );
  }
  await writeFile(root + out + "source137.json", bytes, { flag: "wx" });
  const protectedSources = Object.fromEntries(
    Object.keys(canonical)
      .filter((p) => !existing.includes(p))
      .map((p) => [p, now[p]]),
  );
  assert.equal(Object.keys(protectedSources).length, 131);
  const protectedFiles = Object.fromEntries(
    Object.entries(now).filter(([p]) => !existing.includes(p)),
  );
  for (const p of existing) {
    const dest = root + out + "preimages/" + p;
    await mkdir(dest.slice(0, dest.lastIndexOf("/")), { recursive: true });
    await writeFile(dest, await readFile(root + p), { flag: "wx" });
  }
  await writeFile(root + out + "protected-files.json", json(protectedFiles), {
    flag: "wx",
  });
  await writeFile(
    root + out + "protected-sources131.json",
    json(protectedSources),
    { flag: "wx" },
  );
  const baseline = {
    base: "ba282fa (main supplied; no Git operation)",
    existing,
    additions,
    source137: sha(bytes),
    protectedFiles: Object.keys(protectedFiles).length,
    protectedFilesAggregate: sha(json(protectedFiles)),
    protectedSources: 131,
    protectedSourcesAggregate: sha(json(protectedSources)),
  };
  await writeFile(root + out + "baseline.json", json(baseline), { flag: "wx" });
  process.stdout.write(json(baseline));
} else {
  const old = JSON.parse(
      await readFile(root + out + "protected-files.json", "utf8"),
    ),
    sources = JSON.parse(
      await readFile(root + out + "protected-sources131.json", "utf8"),
    );
  const changed = Object.keys(old).filter(
      (p) => JSON.stringify(old[p]) !== JSON.stringify(now[p]),
    ),
    extra = Object.keys(now).filter(
      (p) =>
        !Object.hasOwn(old, p) &&
        !existing.includes(p) &&
        !additions.includes(p),
    ),
    changedSources = Object.keys(sources).filter(
      (p) => JSON.stringify(sources[p]) !== JSON.stringify(now[p]),
    );
  const result = {
    protectedFiles: Object.keys(old).length,
    protectedSources: 131,
    changed,
    extra,
    changedSources,
  };
  await writeFile(root + out + "scope-result.json", json(result));
  process.stdout.write(json(result));
  assert.deepEqual(changedSources, []);
  assert.deepEqual(changed, []);
  assert.deepEqual(extra, []);
}
