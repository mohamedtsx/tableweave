import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { own, root } from "./scope-paths.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const artifacts = join(own, ".artifacts");
const index = "packages/react/src/index.ts";
const after =
  "f7f226b64d2dd141a8ee133383d26bc0fcb36cc909fddd0d901f765e331ed318";
const allocated = [
  "packages/heroui/src/table/types.ts",
  "packages/heroui/src/table/renderer-commit.ts",
  "packages/heroui/src/table/native-collection.tsx",
  "packages/heroui/src/selection/types.ts",
  "packages/heroui/src/selection/selection-toolbar.tsx",
];
async function files(directory) {
  const result = [];
  for (const entry of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}
const original = JSON.parse(
  await readFile(join(artifacts, "before-source126.json"), "utf8"),
);
assert.equal(
  hash(await readFile(join(artifacts, "before-source126.json"))),
  "4a956137a365746d964c084a161884853650138c36e1aebe6a586d178345b731",
);
const protected121 = JSON.parse(
  await readFile(join(artifacts, "protected-source121.json"), "utf8"),
);
assert.deepEqual(
  protected121,
  Object.fromEntries(
    Object.entries(original).filter(([path]) => !allocated.includes(path)),
  ),
);
assert.equal(
  original[index].sha256,
  "97baabc70d6896dd7448dc483840b98af9d7f29f0e60add96890381d6a4ec36d",
);
assert.equal(hash(await readFile(join(root, index))), after);
assert.equal(
  hash(
    await readFile("/tmp/opencode/wp09-before-native-render-helper-index.ts"),
  ),
  original[index].sha256,
);
const subset = Object.fromEntries(
  Object.entries(protected121).filter(([path]) => path !== index),
);
assert.equal(Object.keys(subset).length, 120);
for (const [path, entry] of Object.entries(subset)) {
  assert.equal(hash(await readFile(join(root, path))), entry.sha256, path);
  assert.equal(
    (await stat(join(root, path))).mode & 0o111 ? "100755" : "100644",
    entry.mode,
    path,
  );
}
const beforeInputs = JSON.parse(
  await readFile(join(artifacts, "before-inputs.json"), "utf8"),
);
for (const [path, sha] of Object.entries(
  JSON.parse(await readFile(join(artifacts, "vendor-trace.json"), "utf8")),
))
  assert.equal(hash(await readFile(join(root, path))), sha, path);
for (const [path, sha] of Object.entries(beforeInputs))
  assert.equal(hash(await readFile(join(root, path))), sha, path);
if (process.argv[2] === "--before") {
  for (const path of allocated)
    assert.equal(
      hash(await readFile(join(root, path))),
      original[path].sha256,
      path,
    );
  await writeFile(
    join(artifacts, "resume-protected-source120.json"),
    `${JSON.stringify(subset, null, 2)}\n`,
    { flag: "wx" },
  );
  for (const file of ["handoff.json", "scope-final-light.log"])
    await writeFile(
      join(artifacts, `stopped-${file}`),
      await readFile(join(artifacts, file)),
      { flag: "wx" },
    );
} else if (process.argv[2] === "--after") {
  const stopped = JSON.parse(
    await readFile(join(artifacts, "stopped-handoff.json"), "utf8"),
  );
  assert.equal(
    hash(await readFile(join(artifacts, "stopped-README.md"))),
    stopped.inputs["tests/table-renderer-collection/README.md"],
  );
  for (const path of [
    "tests/table-renderer-collection/BLOCKER.md",
    "tests/table-renderer-collection/scope.mjs",
  ])
    assert.equal(hash(await readFile(join(root, path))), stopped.inputs[path]);
  for (const path of allocated)
    assert.equal(
      hash(await readFile(join(artifacts, "preimages", path))),
      original[path].sha256,
      path,
    );
  assert.deepEqual(
    JSON.parse(
      await readFile(
        join(artifacts, "resume-protected-source120.json"),
        "utf8",
      ),
    ),
    subset,
  );
  const all = [
    ...(await files("packages/react/src")),
    ...(await files("packages/heroui/src")),
  ];
  assert.deepEqual(
    all.sort(),
    [
      ...Object.keys(original),
      "packages/heroui/src/table/renderer-collection.tsx",
    ].sort(),
  );
  const paths = [
    "tests/table-renderer-collection/.artifacts/preimages/packages/heroui/src/table/native-collection.tsx",
    "tests/table-renderer-collection/.artifacts/preimages/packages/heroui/src/selection/selection-toolbar.tsx",
    ...[
      ...allocated,
      "packages/heroui/src/table/renderer-collection.tsx",
      ...(await files("tests/table-renderer-collection")),
    ].filter((path) => !path.includes("/.artifacts/")),
  ].sort();
  const inputs = Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [path, hash(await readFile(join(root, path)))]),
    ),
  );
  const result = {
    status: "implementation-ready PROVISIONAL; final verification deferred",
    inputs,
    aggregate: hash(`${JSON.stringify(inputs, null, 2)}\n`),
    protectedSources: 120,
    mainOwnedIndex: { path: index, sha256: after },
    existingInputsUnchanged: Object.keys(beforeInputs).length,
    historical126And121MapsUnchanged: true,
    runtimeExecuted: false,
    outputIdentityRegistered: false,
  };
  await writeFile(
    join(artifacts, "resumed-handoff.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(JSON.stringify({ ...result, inputs: paths.length }, null, 2));
} else throw new Error("Use --before/--after");
