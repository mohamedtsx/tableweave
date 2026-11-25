import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { capacity, leased, measure, root, walk } from "./scope.mjs";

// Scoped mechanical formatting only; no old file or application module executes.
const label = process.argv[2];
assert(label && /^[a-zA-Z0-9-]{1,64}$/.test(label));
await capacity();
const output = `tests/integration/wp12/evidence/.artifacts/${label}/`;
await mkdir(`${root}/${output}`);
const helpers = (await walk("tests/integration/wp12/evidence/", false)).filter(
  (path) =>
    path.endsWith(".mjs") &&
    !path.includes("/.artifacts/") &&
    !path.includes("/preimages/"),
);
const files = [
  ...leased.filter((path) => /\.(?:tsx?|json|css)$/.test(path)),
  ...helpers,
];
const before = {};
for (const path of files) before[path] = await measure(path);
await writeFile(
  `${root}/${output}before.json`,
  `${JSON.stringify(before, null, 2)}\n`,
  { flag: "wx" },
);
const args = [
  "node_modules/@biomejs/biome/bin/biome",
  "format",
  "--vcs-enabled=false",
  "--write",
  ...files,
];
const result = spawnSync(process.execPath, args, {
  cwd: root,
  encoding: "utf8",
});
await writeFile(
  `${root}/${output}format.log`,
  `${result.stdout ?? ""}${result.stderr ?? ""}`,
  { flag: "wx" },
);
await writeFile(
  `${root}/${output}result.json`,
  `${JSON.stringify({ args, status: result.status }, null, 2)}\n`,
  { flag: "wx" },
);
assert.equal(result.status, 0);
console.log(
  `Mechanically formatted ${files.length} NEW-only supported files; full lint/format remains the separate LIGHT command.`,
);
