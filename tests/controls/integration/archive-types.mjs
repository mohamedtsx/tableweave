import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import { archiveRoot, confinedRequire } from "./archive-stage.mjs";

const root = archiveRoot();
const declared = confinedRequire(root);
for (const compiler of ["typescript", "typescript-5-9"]) {
  const result = spawnSync(
    process.execPath,
    [
      declared(`${compiler}/bin/tsc`),
      "-p",
      join(root, "tsconfig.controls.json"),
      "--listFiles",
    ],
    { cwd: root, encoding: "utf8" },
  );
  writeFileSync(
    join(root, `controls-${compiler}.log`),
    `${result.stdout}${result.stderr}`,
  );
  if (result.status !== 0)
    throw new Error(`Archive ${compiler} check failed; inspect its staged log`);
  const files = result.stdout
    .split("\n")
    .filter((line) => line.startsWith("/"));
  if (!files.length || files.some((file) => !file.startsWith(`${root}${sep}`)))
    throw new Error(
      "Archive type check escaped its own installed consumer (including compiler/type fallback)",
    );
  console.log(
    `ARCHIVE ONLY: ${compiler}, strict/full library check; all resolved files confined to ${root}`,
  );
}
