import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
const own = "tests/reordering/native-lifetime";
const files = [
  "packages/heroui/src/filters/criteria-commit-core.ts",
  "packages/heroui/src/table/renderer-commit.ts",
  "packages/heroui/src/table/native-resource-lifetime.ts",
  ...(await readdir(own))
    .filter((file) => /\.(ts|tsx|mjs|json)$/.test(file))
    .map((file) => `${own}/${file}`),
];
// Formatter computes text only. Source edits are applied with the patch tool.
for (const file of files) {
  const input = await readFile(file, "utf8");
  const output = execFileSync(
    "./node_modules/.bin/biome",
    ["format", `--stdin-file-path=${file}`],
    { input, encoding: "utf8" },
  );
  if (input === output) continue;
  const before = `${own}/.artifacts/format-before.tmp`;
  const after = `${own}/.artifacts/format-after.tmp`;
  await writeFile(before, input);
  await writeFile(after, output);
  let diff;
  try {
    diff = execFileSync("diff", ["-u", before, after], { encoding: "utf8" });
  } catch (error) {
    if (error.status !== 1) throw error;
    diff = error.stdout;
  }
  const hunks = diff
    .split("\n")
    .slice(2)
    .map((line) => (line.startsWith("@@") ? "@@" : line))
    .join("\n");
  await writeFile(
    `${own}/.artifacts/format-${file.replaceAll("/", "_")}.patch`,
    `*** Begin Patch\n*** Update File: ${file}\n${hunks}*** End Patch\n`,
  );
  console.log(file);
}
