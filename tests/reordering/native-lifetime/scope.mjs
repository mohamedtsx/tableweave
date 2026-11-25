import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const own = "tests/reordering/native-lifetime/";
const artifacts = path.join(root, own, ".artifacts");
const changed = new Set([
  "packages/heroui/src/filters/criteria-commit-core.ts",
  "packages/heroui/src/table/renderer-commit.ts",
]);
const added = "packages/heroui/src/table/native-resource-lifetime.ts";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function entry(file) {
  const stat = await lstat(path.join(root, file));
  return {
    mode: stat.isSymbolicLink()
      ? "120000"
      : stat.mode & 0o111
        ? "100755"
        : "100644",
    sha256: digest(await readFile(path.join(root, file))),
  };
}
async function files(dir = "") {
  const result = [];
  for (const item of await readdir(path.join(root, dir), {
    withFileTypes: true,
  })) {
    if ([".git", "node_modules", ".repo"].includes(item.name)) continue;
    const file = path.posix.join(dir, item.name);
    if (file.startsWith(own)) continue;
    if (item.isDirectory()) result.push(...(await files(file)));
    else if (item.isFile()) result.push(file);
  }
  return result.sort();
}
if (process.argv[2] === "capture") {
  const canonicalBytes = await readFile(
    "/tmp/opencode/wp10-before-core-entry-source145.json",
  );
  const canonical = JSON.parse(canonicalBytes);
  if (Object.keys(canonical).length !== 145) throw Error("Not canonical145");
  const canonicalHash = digest(canonicalBytes);
  if (
    canonicalHash !==
    "31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe"
  )
    throw Error(`Canonical digest mismatch ${canonicalHash}`);
  for (const [file, expected] of Object.entries(canonical)) {
    if (JSON.stringify(await entry(file)) !== JSON.stringify(expected))
      throw Error(`Source drift ${file}`);
  }
  await mkdir(artifacts, { recursive: true });
  for (const file of changed)
    await copyFile(
      file,
      path.join(artifacts, `${path.basename(file)}.preimage`),
    );
  await writeFile(path.join(artifacts, "canonical145.json"), canonicalBytes, {
    flag: "wx",
  });
  const baseline = Object.fromEntries(
    await Promise.all(
      (await files()).map(async (file) => [file, await entry(file)]),
    ),
  );
  await writeFile(
    path.join(artifacts, "baseline.json"),
    `${JSON.stringify(baseline, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    JSON.stringify({
      canonicalHash,
      verified: 145,
      baseline: Object.keys(baseline).length,
    }),
  );
} else {
  const baseline = JSON.parse(
    await readFile(path.join(artifacts, "baseline.json"), "utf8"),
  );
  const canonical = JSON.parse(
    await readFile(path.join(artifacts, "canonical145.json"), "utf8"),
  );
  for (const [file, expected] of Object.entries(baseline)) {
    if (changed.has(file)) continue;
    if (JSON.stringify(await entry(file)) !== JSON.stringify(expected))
      throw Error(`Protected drift ${file}`);
  }
  for (const file of await files())
    if (!(file in baseline) && file !== added)
      throw Error(`Unexpected addition ${file}`);
  const protectedSources = Object.keys(canonical).filter(
    (file) => !changed.has(file),
  ).length;
  console.log(
    JSON.stringify({
      protectedSources,
      baseline: Object.keys(baseline).length,
      scope: "pass",
    }),
  );
}
