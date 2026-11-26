import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { selectPublicGeneration } from "./public-generations.mjs";

const selected = selectPublicGeneration(process.argv.slice(2), process.env);
const root = await realpath(fileURLToPath(new URL("../../", import.meta.url)));
const { mode, generation } = selected;
const run = `ordered-${randomUUID()}`;
const target = join(
  root,
  "tests/controls/filter-composition/.artifacts",
  generation,
  run,
);
await mkdir(target, { recursive: true });
const storybook =
  mode === "browser"
    ? await realpath(join(root, "apps/storybook/storybook-static"))
    : undefined;
if (storybook) assert(storybook.startsWith(`${root}${sep}`));
const environment = {
  ...process.env,
  CI: "1",
  DO_NOT_TRACK: "1",
  FILTER_CONTROLS_GENERATION: generation,
  FILTER_CONTROLS_RUN: run,
  ...(storybook ? { FILTER_CONTROLS_STORYBOOK_DIR: storybook } : {}),
  FILTER_CONTROLS_PUBLIC_SHA256: selected.outputSha256,
};
// FILE has highest precedence; no child inherits a caller's report destination.
for (const key of [
  "PLAYWRIGHT_JSON_OUTPUT_FILE",
  "PLAYWRIGHT_JSON_OUTPUT_NAME",
  "PLAYWRIGHT_JSON_OUTPUT_DIR",
])
  delete environment[key];
function command(executable, args, env = environment) {
  const result = spawnSync(executable, args, {
    cwd: root,
    stdio: "inherit",
    env,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `Real composition gate failed: ${args.join(" ")}`,
  );
}
const helpers = "tests/controls/filter-composition";
command(process.execPath, [`${helpers}/verify-public-roots.mjs`]);
// Keep the first snapshot independently of the mutable artifact files. A child
// rewriting its before/after manifests must not redefine the original baseline.
const snapshots = [];
for (const [boundary, script] of [
  ["filter-composition", "capture-roots.mjs"],
  ["focus-handoff", "capture-generation.mjs"],
]) {
  command(process.execPath, [
    `tests/controls/${boundary}/${script}`,
    "--before",
  ]);
  const directory = join(
    root,
    "tests/controls",
    boundary,
    ".artifacts",
    generation,
    run,
  );
  snapshots.push({
    boundary,
    script,
    directory,
    initial: await readFile(join(directory, "roots-before.json")),
  });
}
const reports = [];
if (mode === "types") {
  for (const boundary of ["filter-composition", "focus-handoff"]) {
    command(process.execPath, [`tests/controls/${boundary}/check-types.mjs`]);
    reports.push({ boundary, compilers: ["6.0.3", "5.9.3"], result: "passed" });
  }
} else {
  for (const [name, configuration, expected] of [
    ["composition", "filter-composition/playwright.config.ts", 19],
    ["storybook", "filter-composition/storybook.playwright.config.ts", 4],
    ["focus", "focus-handoff/playwright.config.ts", 10],
  ]) {
    const report = join(target, `${name}.json`);
    command(
      "pnpm",
      [
        "exec",
        "playwright",
        "test",
        "--config",
        `tests/controls/${configuration}`,
        "--reporter=line,json",
        "--output",
        join(target, `${name}-results`),
      ],
      {
        ...environment,
        PLAYWRIGHT_JSON_OUTPUT_NAME: report,
        PLAYWRIGHT_JSON_OUTPUT_FILE: report,
        PLAYWRIGHT_JSON_OUTPUT_DIR: target,
      },
    );
    const result = JSON.parse(await readFile(report, "utf8"));
    assert.equal(
      result.stats.expected,
      expected,
      `Review ${name} inventory changes`,
    );
    for (const key of ["unexpected", "skipped", "flaky"])
      assert.equal(result.stats[key], 0, `${name}: ${key}`);
    reports.push({ boundary: name, tests: result.stats });
  }
}
for (const snapshot of snapshots) {
  command(process.execPath, [
    `tests/controls/${snapshot.boundary}/${snapshot.script}`,
  ]);
  for (const name of ["roots-before.json", "roots-after.json"])
    assert(
      snapshot.initial.equals(await readFile(join(snapshot.directory, name))),
      `${snapshot.boundary} ${name} changed from the parent-retained initial snapshot`,
    );
}
command(process.execPath, [`${helpers}/verify-public-roots.mjs`]);
await writeFile(
  join(target, "report.json"),
  JSON.stringify(
    {
      generation,
      selection: selected.selection,
      outputCount: selected.outputCount,
      outputSha256: selected.outputSha256,
      mode,
      packageBuildsDuringRun: false,
      installsDuringRun: false,
      sourceSnapshotSha256: Object.fromEntries(
        snapshots.map(({ boundary, initial }) => [
          boundary,
          createHash("sha256").update(initial).digest("hex"),
        ]),
      ),
      snapshotCounts: Object.fromEntries(
        snapshots.map(({ boundary, initial }) => {
          const captured = JSON.parse(initial.toString("utf8"));
          const entries =
            boundary === "focus-handoff"
              ? { ...captured.roots.sources, ...captured.roots.outputs }
              : captured;
          const outputs = Object.keys(entries).filter((path) =>
            /^packages\/(?:react|heroui)\/dist\//.test(path),
          ).length;
          return [
            boundary,
            { sourcePublic: Object.keys(entries).length, outputs },
          ];
        }),
      ),
      reports,
    },
    null,
    2,
  ),
  { flag: "wx" },
);
console.log(`Real tool/control ${mode} gates passed: ${target}`);
