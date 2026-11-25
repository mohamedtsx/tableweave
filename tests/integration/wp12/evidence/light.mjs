import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { capacity, leased, root, walk } from "./scope.mjs";

const label = process.argv[2];
assert(label && /^[a-zA-Z0-9-]{1,64}$/.test(label));
await capacity();
const own = "tests/integration/wp12/evidence/";
await mkdir(`${root}/${own}.artifacts/`, { recursive: true });
const output = `${own}.artifacts/${label}/`;
await mkdir(`${root}/${output}`);
const helpers = (await walk(own, false)).filter(
  (path) =>
    path.endsWith(".mjs") &&
    !path.includes("/.artifacts/") &&
    !path.includes("/preimages/"),
);
const supported = [
  ...leased.filter((path) => /\.(?:tsx?|json|css)$/.test(path)),
  ...helpers,
];
const commands = [
  ["pins-before", [`${own}inputs.mjs`, `${output}inputs.json`]],
  [
    "positive",
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "tests/integration/wp12/tsconfig.light.json",
      "--pretty",
      "false",
    ],
  ],
  ["static", [`${own}static.mjs`]],
  ["scope", [`${own}scope.mjs`]],
  ...helpers.map((path) => [
    `syntax-${path.split("/").at(-1)}`,
    ["--check", path],
  ]),
  [
    "biome",
    [
      "node_modules/@biomejs/biome/bin/biome",
      "check",
      "--vcs-enabled=false",
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
    maxBuffer: 8 * 1024 * 1024,
  });
  await writeFile(
    `${root}/${output}${name}.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}`,
    { flag: "wx" },
  );
  results.push({
    name,
    args,
    status: result.status,
    signal: result.signal,
    executionError: result.error?.code ?? null,
  });
  await writeFile(
    `${root}/${output}results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
  assert.equal(
    result.status,
    0,
    `${name} failed; preserved ${output}${name}.log`,
  );
}
console.log(
  `LIGHT PASS ${label}: strict TS6 SOURCE/noEmit, scope/static/syntax/full Biome formatter ON assist OFF, stable actual pins. Browser/React/config/framework/test bodies NOT executed.`,
);
