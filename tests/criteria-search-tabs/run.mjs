import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// FINAL PHASE ONLY. Never invokes a shared build or installs dependencies.
const label = process.argv[2];
assert(
  label && /^[a-zA-Z0-9_-]+$/.test(label),
  "Supply a fresh evidence label",
);
const root = fileURLToPath(new URL("../../", import.meta.url));
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const directory = new URL(`./.artifacts/${label}-units/`, import.meta.url);
await mkdir(directory);
const result = spawnSync(
  process.execPath,
  [
    `${root}node_modules/vitest/vitest.mjs`,
    "run",
    "--config",
    "tests/criteria-search-tabs/vitest.config.mjs",
  ],
  {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      CRITERIA_SEARCH_TABS_ARTIFACT_DIR: fileURLToPath(directory),
    },
  },
);
await writeFile(
  new URL("units.log", directory),
  `${result.stdout ?? ""}${result.stderr ?? ""}`,
);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
