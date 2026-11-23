import { spawnSync } from "node:child_process";

const mode = process.argv[2];
if (mode !== "dev" && mode !== "build")
  throw new Error("Expected dev or build");
for (const args of [
  ["build"],
  ["--filter", "@tableweave/storybook", mode, ...process.argv.slice(3)],
]) {
  const result = spawnSync("pnpm", args, {
    stdio: "inherit",
    env: {
      ...process.env,
      STORYBOOK_DISABLE_TELEMETRY: "1",
      DO_NOT_TRACK: "1",
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
