import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { root, own, files, capacity } from "./scope.mjs";
export async function light(label) {
  assert(/^[a-z0-9-]+$/.test(label));
  await capacity();
  const directory = `${own}evidence/${label}/`;
  await mkdir(resolve(root, directory));
  const supported = [
    ...(await files(own)).filter(
      (path) =>
        !path.startsWith(`${own}evidence/`) &&
        /\.(ts|tsx|mjs|json|css)$/.test(path),
    ),
    `${own}evidence/runner-input.schema.json`,
    `${own}evidence/blocked.json`,
  ];
  const commands = [
    ["pins-before", [`${own}inputs.mjs`, `${directory}inputs.json`]],
    [
      "positive",
      [
        "node_modules/typescript/bin/tsc",
        "-p",
        `${own}tsconfig.source-light.json`,
        "--pretty",
        "false",
      ],
    ],
    ["scope", [`${own}scope.mjs`, "verify"]],
    ...supported
      .filter((path) => path.endsWith(".mjs"))
      .map((path) => [`syntax-${path.split("/").at(-1)}`, ["--check", path]]),
    ["static", [`${own}static.mjs`]],
    [
      "biome",
      [
        "node_modules/@biomejs/biome/bin/biome",
        "check",
        "--assist-enabled=false",
        ...supported,
        "--max-diagnostics=100",
      ],
    ],
    ["pins-after", [`${own}inputs.mjs`, `${directory}inputs.json`, "verify"]],
  ];
  const results = [];
  for (const [name, args] of commands) {
    await capacity();
    const result = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      timeout: 300000,
    });
    await capacity();
    await writeFile(
      resolve(root, `${directory}${name}.log`),
      `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`,
      { flag: "wx" },
    );
    results.push({ name, args, status: result.status, signal: result.signal });
    await writeFile(
      resolve(root, `${directory}results.json`),
      `${JSON.stringify(results, null, 2)}\n`,
    );
    assert.equal(
      result.status,
      0,
      `${name} failure preserved at ${directory}${name}.log`,
    );
  }
  console.log(
    `Source LIGHT only passed ${directory}; ${supported.length} files. No fixture/checksum/statistics/runtime/benchmark execution.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await light(process.argv[2]);
