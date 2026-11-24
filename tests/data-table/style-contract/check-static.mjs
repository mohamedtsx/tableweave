import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { inspectCss } from "./inspect-css.mjs";
import { artifacts, cssPath, hash, root } from "./scope.mjs";

await mkdir(artifacts, { recursive: true });
const css = await readFile(join(root, cssPath), "utf8");
const biomePackage = JSON.parse(
  await readFile(
    join(root, "node_modules/@biomejs/biome/package.json"),
    "utf8",
  ),
);
assert.equal(biomePackage.version, "2.6.8");
const args = [
  "node_modules/@biomejs/biome/bin/biome",
  "check",
  "--css-formatter-enabled=true",
  "--css-parse-tailwind-directives=false",
  "--error-on-warnings",
  "--verbose",
  cssPath,
];
const result = spawnSync(process.execPath, args, {
  cwd: root,
  env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  encoding: "utf8",
  timeout: 30000,
});
// Keep exact logs including failures; never overwrite a prior invocation.
const logPath = join(artifacts, `css-biome-${Date.now()}.log`);
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
await writeFile(logPath, output, {
  flag: "wx",
});
assert.ifError(result.error);
assert.equal(result.status, 0, `CSS parse/format check failed: ${logPath}`);
assert.match(output, /Checked 1 file\b/, "Skipped files are not parsing proof");
assert(output.includes(cssPath), "Verbose report must identify the CSS input");
const contract = inspectCss(css);
const variablesPath =
  "packages/heroui/node_modules/@heroui/styles/dist/themes/default/variables.css";
const variables = await readFile(join(root, variablesPath), "utf8");
const stylesPackage = JSON.parse(
  await readFile(
    join(root, "packages/heroui/node_modules/@heroui/styles/package.json"),
    "utf8",
  ),
);
assert.equal(stylesPackage.version, "3.2.8");
for (const token of contract.tokens)
  assert(variables.includes(`${token}:`), `Actual pinned theme lacks ${token}`);
const report = {
  status: "PASS LIGHT CSS syntax/format + restricted static structure only",
  css: cssPath,
  sha256: hash(css),
  parser: {
    tool: "@biomejs/biome",
    version: biomePackage.version,
    command: [process.execPath, ...args],
    logPath,
    exitCode: result.status,
    cssFormatterExplicitlyEnabled: true,
    skipped: false,
  },
  pinnedStyles: {
    version: stylesPackage.version,
    variablesPath,
    variablesSha256: hash(variables),
  },
  ...contract,
  activated: false,
  runtimeUnitsOrBrowserExecuted: false,
};
await writeFile(
  join(artifacts, "static-result.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
