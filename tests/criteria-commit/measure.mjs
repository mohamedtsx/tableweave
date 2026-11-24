import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

const source = "packages/heroui/src/filters/criteria-commit.tsx";
const names = (await readdir(new URL("./", import.meta.url)))
  .filter(
    (name) =>
      name !== "README.md" &&
      name !== "handoff-hashes.json" &&
      !name.startsWith("."),
  )
  .sort();
const entries = [
  [source, new URL(`../../${source}`, import.meta.url)],
  ...names.map((name) => [
    `tests/criteria-commit/${name}`,
    new URL(name, import.meta.url),
  ]),
];
const hashes = Object.fromEntries(
  await Promise.all(
    entries.map(async ([name, url]) => [
      name,
      createHash("sha256")
        .update(await readFile(url))
        .digest("hex"),
    ]),
  ),
);
await writeFile(
  new URL("./handoff-hashes.json", import.meta.url),
  `${JSON.stringify(hashes, null, 2)}\n`,
);
console.log(
  `New helper SHA-256 ${hashes[source]}; ${names.length} own fixture/evidence files measured. README/self/artifacts excluded; not an approval seal.`,
);
