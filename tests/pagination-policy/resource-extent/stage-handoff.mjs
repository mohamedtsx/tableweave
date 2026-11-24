import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hash, original, own, root } from "./guard.mjs";

// A source/input-only scope check, deliberately not an output/evidence manifest.
const art = join(own, ".artifacts");
const before = JSON.parse(
  await readFile(join(art, "before-source105.json"), "utf8"),
);
const protectedSources = Object.fromEntries(
  Object.entries(before).filter(([path]) => !Object.hasOwn(original, path)),
);
assert.equal(Object.keys(protectedSources).length, 102);
for (const [path, expected] of Object.entries(protectedSources))
  assert.equal(
    hash(await readFile(join(root, path))),
    expected.sha256,
    `Protected source: ${path}`,
  );
await writeFile(
  join(art, "protected-source102.json"),
  `${JSON.stringify(protectedSources, null, 2)}\n`,
  { flag: "wx" },
);
const ownPaths = (await readdir(own, { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => `tests/pagination-policy/resource-extent/${entry.name}`);
const paths = [...Object.keys(original), ...ownPaths].sort();
const inputs = Object.fromEntries(
  await Promise.all(
    paths.map(async (path) => [path, hash(await readFile(join(root, path)))]),
  ),
);
const codeInputs = Object.fromEntries(
  Object.entries(inputs).filter(([path]) => !path.endsWith("/README.md")),
);
const aggregate = (map) => hash(`${JSON.stringify(map, null, 2)}\n`);
const handoff = {
  status:
    "PROVISIONAL — implemented, not agent-approved; final verification deferred by user",
  root,
  startingHead: "0288904d2764796909ffadfe1660949975039bba",
  initialSource105:
    "497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790",
  sourceScope: {
    protectedSources: 102,
    unchanged: true,
    outputFingerprinting: false,
  },
  inputCount: paths.length,
  inputs,
  aggregate: aggregate(inputs),
  codeInputCount: Object.keys(codeInputs).length,
  codeAggregate: aggregate(codeInputs),
  actualResults: {
    before: {
      legacyScenarios: 5,
      newPolicyFailedTests: 5,
      originalSourcesMatched: true,
      runtimeModules: 4,
    },
    earlierPostImplementation: {
      firstUnitsPassed: 343,
      firstUnitsImportFailedSuites: 1,
      secondUnitsPassed: 344,
      secondUnitsFiles: 17,
      newTests: 86,
      unchangedResourceTests: 47,
      unchangedContractsControllerTests: 211,
      graphModules: 4,
      bareNode: true,
      sourceTS6: true,
      protectedSources: 102,
      otherInputs: 941,
      sealUnchanged: true,
      appliesToFinalAuthoredAggregate: false,
    },
    finalLightweight: {
      ownTS6NoEmit: true,
      biomeInputFiles: 18,
      protectedSourceBytes: 102,
      noFullRuntimeRerun: true,
    },
  },
  authoringAfterRuntime: [
    "three additional runtime cases",
    "fixture typing without intended runtime changes",
    "type fixture/runner authoring and directive placement",
    "source comments and scoped formatting",
  ],
  deferred: [
    "current authored runtime suite",
    "strict TS5.9 and whole-source final TS6 matrix",
    "own-emitted declaration consumers",
    "64 intended individual meaningful type negatives",
    "final runtime graph and bare Node replay",
    "full stage input/seal/output verification",
    "broader existing resource type fixtures",
    "independent review/fixes/approval",
    "main public output/discovery integration",
  ],
  limits: [
    "metadata consistency, not backend truth/authentication",
    "no U4/native/control binding",
    "no browser/full SSR/AT/packed/performance/full AC proof",
    "no output-generation waiver",
    "no Git mutation/approval/merge",
  ],
};
await writeFile(
  join(art, "handoff.json"),
  `${JSON.stringify(handoff, null, 2)}\n`,
  { flag: "wx" },
);
console.log(
  JSON.stringify(
    {
      status: handoff.status,
      inputs: paths.length,
      aggregate: handoff.aggregate,
      codeInputs: handoff.codeInputCount,
      codeAggregate: handoff.codeAggregate,
      sources: Object.fromEntries(
        Object.keys(original).map((path) => [path, inputs[path]]),
      ),
      protectedSources: 102,
    },
    null,
    2,
  ),
);
