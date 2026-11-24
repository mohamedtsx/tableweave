import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const mode = process.argv[2];
assert(
  mode === "source" || mode === "public",
  "Choose the source or public control boundary explicitly",
);
const configurations =
  mode === "source"
    ? [
        "core/native.playwright.config.ts",
        "selection/playwright.config.ts",
        "pagination/playwright.config.ts",
        "columns/playwright.config.ts",
        "collection/playwright.config.ts",
        "collection/legacy.playwright.config.ts",
      ]
    : [
        "integration/playwright.config.ts",
        "integration/storybook.playwright.config.ts",
      ];

// Several independently owned suites deliberately share a port. Serialize them,
// fail on the first defect and leave their assertion deadlines/retries untouched.
// Public mode expects real frozen package output and an already-built Storybook;
// this runner never builds or repairs those artifacts during browser execution.
for (const configuration of configurations) {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "playwright",
      "test",
      "--config",
      `tests/controls/${configuration}`,
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, CI: "1", DO_NOT_TRACK: "1" },
    },
  );
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `Control browser boundary failed: ${configuration}`,
  );
}
