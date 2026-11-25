import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  lstat,
  readdir,
  readFile,
  readlink,
  writeFile,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url)),
  own = "tests/data-table/shell/",
  out = `${root}${own}.artifacts/`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex"),
  json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const before = JSON.parse(await readFile(`${out}protected-files.json`, "utf8")),
  sources = JSON.parse(
    await readFile(`${out}protected-sources131.json`, "utf8"),
  ),
  baseline = JSON.parse(await readFile(`${out}baseline.json`, "utf8"));
async function walk(dir = "") {
  const result = {};
  for (const entry of await readdir(root + dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".repo"].includes(entry.name)) continue;
    const p = dir + entry.name;
    if (`${p}/` === own) continue;
    if (entry.isDirectory()) Object.assign(result, await walk(`${p}/`));
    else {
      const s = await lstat(root + p);
      result[p] = {
        mode: s.mode.toString(8),
        sha256: sha(
          s.isSymbolicLink()
            ? await readlink(root + p)
            : await readFile(root + p),
        ),
      };
    }
  }
  return result;
}
const now = await walk(),
  changed = Object.keys(before).filter(
    (p) => JSON.stringify(before[p]) !== JSON.stringify(now[p]),
  ),
  changedSources = Object.keys(sources).filter(
    (p) => JSON.stringify(sources[p]) !== JSON.stringify(now[p]),
  ),
  extra = Object.keys(now).filter(
    (p) =>
      !Object.hasOwn(before, p) &&
      !baseline.existing.includes(p) &&
      !baseline.additions.includes(p),
  );
// Observed live main bookkeeping only: neither file was edited/restored by this
// worker. This is not a replacement baseline or a passing original full-file guard.
const mainChanges = [
  "TASKS.md",
  "docs/planning/wp-09-facade-builder-host-plan.md",
];
assert.deepEqual(changed, mainChanges);
assert.deepEqual(changedSources, []);
assert.deepEqual(extra, []);
const result = {
  originalProtectedFiles: Object.keys(before).length,
  unchangedOtherFiles: Object.keys(before).length - changed.length,
  protectedSources: 131,
  changedSources,
  extra,
  observedExternalMainChanges: changed.map((path) => ({
    path,
    before: before[path],
    after: now[path],
  })),
  originalStrictGuard:
    "scope-handoff.log correctly fails against these two live main metadata edits; original maps/guard preserved without rebase",
};
await writeFile(`${out}metadata-scope-result.json`, json(result));
process.stdout.write(json(result));
