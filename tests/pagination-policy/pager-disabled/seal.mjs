import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { allocated, hash, own, root } from "./guard.mjs";

const after = JSON.parse(
  await readFile(join(own, ".artifacts/after.json"), "utf8"),
);
const before = JSON.parse(
  await readFile(join(own, ".artifacts/before.json"), "utf8"),
);
for (const key of ["protectedSources", "inputs", "browser", "installed"])
  assert.deepEqual(after[key], before[key]);
const types = JSON.parse(
  await readFile(join(own, ".artifacts/types-authored/result.json"), "utf8"),
);
assert.equal(types.exitCode, 0);
const syntax = [];
for (const entry of await readdir(own))
  if (entry.endsWith(".mjs")) {
    const result = spawnSync(process.execPath, ["--check", join(own, entry)], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    syntax.push(entry);
  }
const deltas = {};
for (const path of allocated) {
  const original = join(
    own,
    ".artifacts",
    `original-${path.split("/").at(-1)}`,
  );
  const current = join(root, path);
  const diff = spawnSync("diff", ["-u", original, current], {
    encoding: "utf8",
  });
  assert.ok([0, 1].includes(diff.status), diff.stderr);
  deltas[path] = {
    before: before.sources[path],
    after: after.sources[path],
    diff: diff.stdout,
  };
}
const files = {};
async function walk(directory) {
  for (const entry of await readdir(join(own, directory), {
    withFileTypes: true,
  })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile())
      files[path] = hash(await readFile(join(own, path)));
  }
}
await walk("");
const ordered = Object.fromEntries(
  Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)),
);
const authored = Object.fromEntries(
  Object.entries(ordered).filter(([path]) => !path.startsWith(".artifacts/")),
);
const result = {
  status: "PROVISIONAL; no new behavioral test executions",
  suppliedHEAD: "7e05505; supplied by main, no Git commands",
  sourceBefore: before.sourceAggregate,
  sourceAfter: after.sourceAggregate,
  protectedSources: Object.keys(after.protectedSources).length,
  protectedFiles: Object.keys(after.inputs).length,
  frozenBrowserFiles: Object.keys(after.browser).length,
  installedAssets: Object.keys(after.installed).length,
  syntax,
  types,
  authoredCases: { renderToString: 10, browser: 9, executed: 0 },
  historicalBrowser: "14 cases: 12 passed / 2 failed; frozen, not rerun",
  deltas,
  authored,
  newTestAggregate: hash(`${JSON.stringify(authored, null, 2)}\n`),
  artifacts: ordered,
};
await writeFile(
  join(own, ".artifacts/handoff.json"),
  `${JSON.stringify(result, null, 2)}\n`,
  { flag: "wx" },
);
console.log(
  JSON.stringify(
    {
      sourceAfter: result.sourceAfter,
      newTestAggregate: result.newTestAggregate,
      protectedSources: result.protectedSources,
      protectedFiles: result.protectedFiles,
      frozenBrowserFiles: result.frozenBrowserFiles,
      installedAssets: result.installedAssets,
      syntax: syntax.length,
      types,
      authoredCases: result.authoredCases,
    },
    null,
    2,
  ),
);
