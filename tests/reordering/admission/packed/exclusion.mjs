// Run only in an isolated real installed/packed consumer, never source aliases.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const directory = process.argv[2];
assert(directory, "Pass the actual installed @tableweave/react directory");
const root = pathToFileURL(`${resolve(directory)}/`);
const manifest = JSON.parse(
  await readFile(new URL("package.json", root), "utf8"),
);
assert(
  manifest.exports["./reordering-controller"],
  "Actual client export required",
);
for (const entry of [".", "./contracts", "./criteria", "./reordering"]) {
  const seen = new Set();
  async function visit(url) {
    if (seen.has(url.href)) return;
    seen.add(url.href);
    assert(!url.pathname.includes("reordering-controller"));
    const source = await readFile(url, "utf8");
    assert(!/@dnd-kit|\/sortable\//.test(source));
    if (entry === "./reordering")
      assert(!/from\s+["'](?:react|@tanstack|@heroui)/.test(source));
    for (const match of source.matchAll(
      /(?:from\s*|import\s*)["'](\.[^"']+\.js)["']/g,
    ))
      await visit(new URL(match[1], url));
  }
  await visit(new URL(manifest.exports[entry].import, root));
}
console.log(
  "Actual packed default/contracts/criteria/pure closures exclude client helper/DnD; no source aliases used.",
);
