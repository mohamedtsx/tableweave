import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// FINAL PHASE ONLY. Each counterexample removes one directive independently.
const compiler = process.argv[2],
  label = process.argv[3];
assert(["typescript", "typescript-5-9"].includes(compiler));
assert(
  label && /^[a-zA-Z0-9_-]+$/.test(label),
  "Supply a fresh evidence label",
);
const root = fileURLToPath(new URL("../../", import.meta.url));
const directory = new URL(
  `./.artifacts/${label}-${compiler}-negative/`,
  import.meta.url,
);
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
await mkdir(directory, { recursive: false });
const original = await readFile(
  new URL("./negative-types.ts", import.meta.url),
  "utf8",
);
const directives = [...original.matchAll(/^.*@ts-expect-error.*$/gm)];
assert.equal(directives.length, 12);
const sourceURL = new URL("./candidate.ts", directory);
const configURL = new URL("./tsconfig.json", directory);
const absolute = (path) => fileURLToPath(new URL(path, import.meta.url));
const adjusted = original
  .replaceAll('"../../packages/', `"${absolute("../../packages/")}`)
  .replaceAll('"./types.js"', `"${absolute("./types.js")}"`)
  .replaceAll('"./fixtures.js"', `"${absolute("./fixtures.js")}"`);
await writeFile(
  configURL,
  JSON.stringify({
    extends: absolute("./tsconfig.json"),
    files: [fileURLToPath(sourceURL)],
    include: [],
    exclude: [],
  }),
);
function run() {
  return spawnSync(
    process.execPath,
    [
      `${root}node_modules/${compiler}/bin/tsc`,
      "-p",
      fileURLToPath(configURL),
      "--pretty",
      "false",
    ],
    { cwd: root, encoding: "utf8" },
  );
}
await writeFile(sourceURL, adjusted);
let result = run();
await writeFile(
  new URL("baseline.log", directory),
  `${result.stdout}${result.stderr}`,
);
assert.equal(
  result.status,
  0,
  "All expected-error directives must be live in the baseline",
);
for (const [index] of directives.entries()) {
  let occurrence = 0;
  const candidate = adjusted.replace(/^.*@ts-expect-error.*$/gm, (match) =>
    occurrence++ === index ? "// Removed one negative directive" : match,
  );
  await writeFile(sourceURL, candidate);
  result = run();
  const output = `${result.stdout}${result.stderr}`;
  await writeFile(
    new URL(`N${String(index + 1).padStart(2, "0")}.log`, directory),
    output,
  );
  assert.equal(
    result.status,
    2,
    `N${index + 1} must produce an actual diagnostic`,
  );
  assert.match(output, /candidate\.ts\(\d+,\d+\): error TS/);
  assert.equal(
    [...output.matchAll(/error TS\d+:/g)].length,
    1,
    "Only the individually exposed counterexample may fail",
  );
  assert(
    !output.includes("error TS2578"),
    "Other expected-error directives must remain live",
  );
}
console.log(
  `Baseline + ${directives.length} individually removed negatives passed (${compiler}); private fixture only.`,
);
