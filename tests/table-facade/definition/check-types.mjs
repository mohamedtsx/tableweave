// FINAL-PHASE runner. Not part of the provisional lightweight check.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const own = fileURLToPath(new URL("./", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
const [compiler, mode, ...extra] = process.argv.slice(2);
assert(
  ["typescript", "typescript-5-9"].includes(compiler) &&
    ["source", "emitted"].includes(mode) &&
    !extra.length,
  "Choose explicit compiler and source/emitted mode",
);
const directory = join(
  own,
  ".artifacts",
  `types-${compiler}-${mode}-${randomUUID()}`,
);
const fixture = join(directory, "fixtures");
const producer = join(directory, "producer");
mkdirSync(fixture, { recursive: true });
const cli = join(root, "node_modules", compiler, "bin/tsc");
function command(args, log) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  writeFileSync(join(directory, log), output, { flag: "wx" });
  return { status: result.status, output };
}
if (mode === "emitted") {
  const result = command(
    [
      "-p",
      join(root, "packages/react/tsconfig.build.json"),
      "--outDir",
      producer,
      "--pretty",
      "false",
    ],
    "emit.log",
  );
  assert.equal(result.status, 0, result.output);
}
const prefix = `${relative(
  fixture,
  mode === "source" ? join(root, "packages/react/src") : producer,
)
  .split(sep)
  .join("/")}/`;
const originalNegative = readFileSync(join(own, "negative.ts"), "utf8");
for (const name of ["positive.ts", "negative.ts"])
  writeFileSync(
    join(fixture, name),
    readFileSync(join(own, name), "utf8").replaceAll(
      "../../../packages/react/src/",
      prefix,
    ),
    { flag: "wx" },
  );
const config = join(directory, "tsconfig.json");
writeFileSync(
  config,
  JSON.stringify(
    {
      extends: join(own, "tsconfig.light.json"),
      files: [join(fixture, "positive.ts"), join(fixture, "negative.ts")],
      include: [],
    },
    null,
    2,
  ),
);
const baseline = command(["-p", config, "--pretty", "false"], "annotated.log");
assert.equal(baseline.status, 0, baseline.output);
const lines = originalNegative.split("\n");
const markers = [];
for (let index = 0; index < lines.length; index++) {
  const match = lines[index].match(/^\s*\/\/ @ts-expect-error (P1-N\d+) /);
  if (match) markers.push({ id: match[1], line: index + 1 });
}
assert.equal(markers.length, 20, "Review the intended negative inventory");
const stripped = originalNegative
  .replace(/^.*@ts-expect-error P1-N\d+.*$/gm, "")
  .replaceAll("../../../packages/react/src/", prefix);
writeFileSync(join(fixture, "negative.ts"), stripped);
const rejected = command(
  ["-p", config, "--pretty", "false"],
  "all-directives-removed.log",
);
assert.notEqual(rejected.status, 0);
const diagnostics = [
  ...rejected.output.matchAll(
    /([^\r\n]+)\((\d+),(\d+)\): error TS(\d+): ([^\r\n]+)/g,
  ),
].map((match) => ({
  file: match[1],
  line: Number(match[2]),
  code: Number(match[4]),
  message: match[5],
}));
assert(diagnostics.length >= markers.length, "Missing meaningful diagnostics");
for (let index = 0; index < markers.length; index++) {
  const marker = markers[index];
  const end = markers[index + 1]?.line ?? lines.length + 1;
  const errors = diagnostics.filter(
    (diagnostic) =>
      diagnostic.file.endsWith("negative.ts") &&
      diagnostic.line > marker.line &&
      diagnostic.line < end,
  );
  assert(errors.length, `No intended rejection in ${marker.id}`);
  assert(
    errors.every((error) => ![2578, 6133, 6196].includes(error.code)),
    "Unused marker/local is not meaningful rejection",
  );
}
assert(
  diagnostics.every((diagnostic) => diagnostic.file.endsWith("negative.ts")),
  "Unexpected diagnostic outside supplied negative fixture",
);
writeFileSync(
  join(directory, "report.json"),
  JSON.stringify(
    {
      compiler,
      mode,
      scope:
        mode === "emitted"
          ? "private own package emission; NOT public-root/archive proof"
          : "actual source",
      markers,
      diagnostics,
    },
    null,
    2,
  ),
  { flag: "wx" },
);
console.log(`Deferred P1 type verification completed: ${directory}`);
