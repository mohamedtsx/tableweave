import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const own = fileURLToPath(new URL("./", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
const ts = createRequire(join(root, "package.json"))("typescript");
const parsed = [];
for (const relative of [
  "packages/react/src/table/types.ts",
  "packages/react/src/table/definition.ts",
  "tests/table-facade/definition/definition.test.ts",
  "tests/table-facade/definition/positive.ts",
  "tests/table-facade/definition/negative.ts",
  "tests/table-facade/definition/vitest.config.mts",
]) {
  const source = ts.createSourceFile(
    relative,
    readFileSync(join(root, relative), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  assert.equal(source.parseDiagnostics.length, 0, relative);
  parsed.push(relative);
}
for (const name of [
  "guard.mjs",
  "light.mjs",
  "check-types.mjs",
  "syntax.mjs",
]) {
  const result = spawnSync(process.execPath, ["--check", join(own, name)], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}
mkdirSync(join(own, ".artifacts"), { recursive: true });
const report = {
  parsed,
  parser: ts.version,
  mjsSyntaxChecks: 4,
  typePrograms: 0,
  testsExecuted: 0,
  emission: false,
};
writeFileSync(
  join(own, ".artifacts/syntax.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
