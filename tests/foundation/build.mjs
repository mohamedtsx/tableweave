import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";

// Delete only these owned, ignored build outputs, never source or caller paths.
for (const name of ["react", "heroui"]) {
  await rm(new URL(`../../packages/${name}/dist/`, import.meta.url), {
    recursive: true,
    force: true,
  });
}
const result = spawnSync("pnpm", ["--filter", "./packages/*", "-r", "build"], {
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
