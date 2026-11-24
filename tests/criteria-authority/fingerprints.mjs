import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const output = new URL("./.artifacts/", import.meta.url);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function collect(dir, exclude = []) {
  const files = {};
  for (const entry of await readdir(new URL(dir, root), {
    withFileTypes: true,
  })) {
    if (exclude.includes(entry.name)) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) Object.assign(files, await collect(path, exclude));
    else if (entry.isFile())
      files[path] = sha(await readFile(new URL(path, root)));
  }
  return files;
}
const old = {
  ...(await collect("packages/react/src/controller", ["criteria.ts"])),
  ...(await collect("packages/heroui/src/details")),
};
await mkdir(output, { recursive: true });
if (process.argv[2] === "baseline") {
  const details = Object.entries(old)
    .filter(([path]) => path.startsWith("packages/heroui/src/details/"))
    .map(([path, hash]) => [path.split("/").at(-1), hash]);
  const aggregate = sha(
    details
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, hash]) => `${path} ${hash}\n`)
      .join(""),
  );
  assert.equal(
    aggregate,
    "11ddb455e5bcfefde2a1760886cf720a22fd13935e42841ca02d986d7e9ba5da",
    "Approved details changed before this task",
  );
  await writeFile(
    new URL("baseline.json", output),
    `${JSON.stringify({ old, detailsAggregate: aggregate }, null, 2)}\n`,
  );
  console.log(
    `Baseline: ${Object.keys(old).length} existing controller/details files; approved details aggregate ${aggregate}`,
  );
} else {
  const baseline = JSON.parse(
    await readFile(new URL("baseline.json", output), "utf8"),
  );
  assert.deepEqual(
    old,
    baseline.old,
    "Existing controller/details inputs changed; do not overwrite them",
  );
  const owned = {
    "packages/react/src/controller/criteria.ts": sha(
      await readFile(
        new URL("packages/react/src/controller/criteria.ts", root),
      ),
    ),
    ...(await collect("tests/criteria-authority", [".artifacts"])),
  };
  await writeFile(
    new URL("fingerprints.json", output),
    `${JSON.stringify({ old, owned, detailsAggregate: baseline.detailsAggregate }, null, 2)}\n`,
  );
  console.log(
    `Unchanged guard: ${Object.keys(old).length} existing files; fingerprinted ${Object.keys(owned).length} owned files.`,
  );
}
