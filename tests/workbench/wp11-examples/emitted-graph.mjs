// Deferred build-output check. DO NOT run until main authorizes actual emission.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = new URL("./.artifacts/vite-dist/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("./.vite/manifest.json", base), "utf8"),
);
const headless = Object.values(manifest).find(
  (entry) => entry.src === "headless.html",
);
assert(headless?.isEntry);
const queue = [headless],
  visited = new Set();
while (queue.length) {
  const entry = queue.pop();
  if (visited.has(entry.file)) continue;
  visited.add(entry.file);
  assert.equal(
    (entry.css ?? []).length,
    0,
    `Headless emitted CSS leak: ${entry.file}`,
  );
  const text = await readFile(new URL(entry.file, base), "utf8");
  assert(
    !/@heroui|tailwindcss|@tableweave\/heroui|storybook|\.repo/.test(text),
    entry.file,
  );
  for (const key of [
    ...(entry.imports ?? []),
    ...(entry.dynamicImports ?? []),
  ]) {
    assert(manifest[key]);
    queue.push(manifest[key]);
  }
}
console.log(
  `Headless emitted manifest closure: ${visited.size} assets, no CSS; not package/ordinary/browser/SSR proof.`,
);
