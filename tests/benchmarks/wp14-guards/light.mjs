import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { root, own, changed, files, capacity } from "./scope.mjs";
export async function light(label) {
  assert(/^[a-z0-9-]+$/.test(label));
  await capacity();
  const output = `${own}evidence/${label}/`;
  await mkdir(resolve(root, output), { recursive: false });
  const supported = [
    ...changed,
    ...(await files(own)).filter(
      (file) =>
        !file.startsWith(`${own}evidence/`) && /\.(ts|mjs|json)$/.test(file),
    ),
  ];
  const commands = [
    ["pins-before", [`${own}inputs.mjs`, `${output}inputs.json`]],
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
      .map((path) => [
        `syntax-${path.replaceAll("/", "-")}`,
        ["--check", path],
      ]),
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
    ["pins-after", [`${own}inputs.mjs`, `${output}inputs.json`, "verify"]],
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
      resolve(root, `${output}${name}.log`),
      `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`,
      { flag: "wx" },
    );
    results.push({ name, args, status: result.status, signal: result.signal });
    await writeFile(
      resolve(root, `${output}results.json`),
      `${JSON.stringify(results, null, 2)}\n`,
    );
    assert.equal(
      result.status,
      0,
      `${name}: preserved failure ${output}${name}.log`,
    );
  }
  console.log(
    `Correction SOURCE LIGHT ${output} passes on${supported.length} code/config files; all helper/unit/profile/cleanup/runtime/performance execution UNRUN.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await light(process.argv[2]);
