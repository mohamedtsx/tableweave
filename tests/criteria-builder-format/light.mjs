import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const label = process.argv[2];
assert(label && /^[a-zA-Z0-9_-]+$/.test(label), "Supply a fresh light-evidence label");
const root = fileURLToPath(new URL("../../", import.meta.url));
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const output = new URL(`./.artifacts/${label}/`, import.meta.url);
await mkdir(output);
const prefix = "tests/criteria-builder-format/";
const sources = ["criteria-builder-host.tsx", "filter-builder.tsx", "option-owners.tsx", "types.ts", "value-editors.tsx"].map(name => `packages/heroui/src/filters/${name}`);
const commands = [
  ["reference-ast", [`${prefix}ast.mjs`, "reference"]],
  ["production-ast", [`${prefix}ast.mjs`]],
  ["scope", [`${prefix}stage.mjs`]],
  ...["stage", "ast", "measure", "light"].map(name => [`syntax-${name}`, ["--check", `${prefix}${name}.mjs`]]),
  ["formatter-lint", ["node_modules/@biomejs/biome/bin/biome", "check", "--assist-enabled=false", ...sources, "--max-diagnostics=40"]],
];
const results = [];
for (const [name, args] of commands) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  await writeFile(new URL(`${name}.log`, output), `${result.stdout ?? ""}${result.stderr ?? ""}`, { flag: "wx" });
  results.push({ name, command: [process.execPath, ...args], status: result.status });
  await writeFile(new URL("results.json", output), `${JSON.stringify(results, null, 2)}\n`);
  assert.equal(result.status, 0, `${name} failed; its log is preserved at ${fileURLToPath(output)}`);
  if (result.error) throw result.error;
}
console.log(`Eight light static commands passed; logs at ${fileURLToPath(output)}. No compiler/application/runtime/unit/browser/SSR/negative tests invoked by this helper.`);
