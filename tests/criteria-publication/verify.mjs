import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const commands = [
  [
    "node_modules/vitest/vitest.mjs",
    "run",
    "--configLoader",
    "native",
    "--config",
    "tests/criteria-publication/vitest.config.ts",
  ],
  ["tests/criteria-publication/check-types.mjs"],
  ["tests/criteria-publication/check-boundary.mjs"],
  [
    "node_modules/@biomejs/biome/bin/biome",
    "check",
    "packages/react/src/controller/criteria-publication.ts",
    "tests/criteria-publication",
  ],
  ["tests/criteria-publication/fingerprints.mjs"],
  ["tests/criteria-publication/measure.mjs"],
];
const results = [];
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
for (const args of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  results.push({
    command: [process.execPath, ...args],
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  await writeFile(
    new URL("./.artifacts/final-checks.json", import.meta.url),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  assert.equal(result.status, 0, `Scoped command failed: ${args.join(" ")}`);
}
console.log(
  "Ordered scoped checks passed; no root/package build, install or browser/server.",
);
