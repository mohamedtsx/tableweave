import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// FINAL PHASE ONLY. No module under test is loaded by the static/scope scripts.
const label = process.argv[2];
assert(label && /^[a-zA-Z0-9_-]+$/.test(label), "Supply a fresh final-phase label");
const root = fileURLToPath(new URL("../../", import.meta.url));
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const output = new URL(`./.artifacts/${label}-units/`, import.meta.url);
await mkdir(output);
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--config", "tests/criteria-builder/vitest.config.mjs"], {
  cwd: root, encoding: "utf8", env: { ...process.env, CRITERIA_BUILDER_ARTIFACT_DIR: fileURLToPath(output) },
});
await writeFile(new URL("units.log", output), `${result.stdout ?? ""}${result.stderr ?? ""}`);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
