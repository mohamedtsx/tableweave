import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const before = JSON.parse(
  await readFile(new URL("./before.json", import.meta.url), "utf8"),
);
const sources = [
  "filter-shared.ts",
  "filter-search.tsx",
  "filter-tabs.tsx",
  "criteria-tool-host.tsx",
].map((name) => `packages/heroui/src/toolbar/${name}`);
const own = (await readdir(new URL("./", import.meta.url)))
  .filter(
    (name) =>
      name !== "README.md" &&
      name !== "handoff-hashes.json" &&
      !name.startsWith("."),
  )
  .sort()
  .map((name) => `tests/criteria-search-tabs/${name}`);
const hashes = Object.fromEntries(
  await Promise.all(
    [...sources, ...own].map(async (path) => [
      path,
      createHash("sha256")
        .update(await readFile(new URL(path, root)))
        .digest("hex"),
    ]),
  ),
);
const deltas = Object.fromEntries(
  sources.map((path) => [
    path,
    { before: before[path]?.sha256 ?? null, after: hashes[path] },
  ]),
);
await writeFile(
  new URL("./handoff-hashes.json", import.meta.url),
  `${JSON.stringify({ sources: deltas, files: hashes }, null, 2)}\n`,
);
console.log(
  JSON.stringify({
    sourceDeltas: deltas,
    ownFixtureEvidenceFiles: own.length,
    totalMeasured: Object.keys(hashes).length,
    excludes: ["README.md", "handoff-hashes.json", ".artifacts"],
  }),
);
