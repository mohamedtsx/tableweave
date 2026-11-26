/** FINAL only. Invalid/incomplete runs never acquire passing summaries. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import {
  demand,
  json,
  put,
  record,
  selectCandidate,
  verifyMap,
} from "./candidate.mjs";
import { actualBuild, paintReview } from "./driver.mjs";
import { analyze } from "./statistics.mjs";
export function report(selection, run) {
  const ctx = selectCandidate(selection, "report"),
    built = actualBuild(ctx, run),
    paintReviewSHA256 = paintReview(ctx, run, built);
  const observations = json(run, "measurement/observations.json");
  demand(
    observations.status === "RAW_MEASUREMENT_NOT_SUMMARY_APPROVAL" &&
      observations.candidate === ctx.identity &&
      observations.protocol === built.protocol &&
      observations.runner === ctx.selection.runner.sha256 &&
      observations.buildSHA256 === record(run, "build.json").sha256,
    "E_MEASUREMENT_INPUTS",
  );
  verifyMap(run, observations.files);
  demand(observations.sessions.length === 3, "E_THREE_SESSIONS");
  const oracles = json(run, "validation/validation-0/oracles.json"),
    samples = [];
  for (const session of observations.sessions) {
    demand(
      session.oraclesSHA256 ===
        record(run, "validation/validation-0/oracles.json").sha256,
      "E_ORACLE_FREEZE",
    );
    const bytes = readSamples(run, session.id);
    samples.push(...bytes);
    demand(
      session.observed.platform === "linux" &&
        session.observed.arch === "x64" &&
        typeof session.observed.affinity === "string" &&
        session.actualArguments.includes("--disable-extensions"),
      "E_OBSERVED_ENVIRONMENT",
    );
  }
  const expected = {
    run: ctx.selection.run,
    candidate: ctx.identity,
    runner: observations.runner,
    protocol: built.protocol,
    scheduler: observations.scheduler,
    sessions: observations.sessions,
    oracles,
  };
  const result = analyze(samples, expected);
  const bundle = bundleFacts(ctx, built);
  ctx.revalidate();
  verifyMap(ctx.root, built.files);
  verifyMap(run, observations.files);
  paintReview(ctx, run, built);
  put(run, "report.json", {
    ...result,
    source: {
      candidate: ctx.input.candidate,
      revision: ctx.input.sourceRevision,
      dirty: ctx.input.dirtyState,
      lockSHA256: ctx.input.files["pnpm-lock.yaml"].sha256,
      archives: ctx.archivePair,
      profile: ctx.input.profile,
    },
    observationsSHA256: record(run, "measurement/observations.json").sha256,
    paintReviewSHA256,
    workloadScope:
      "21 budgeted scenarios plus3 separately reported typing scenarios; default lightweight styled renderer",
    bundle,
    notMeasured: {
      drag: "BLOCKED",
      startup: null,
      network: null,
      backend: null,
      ssr: null,
      mobile: null,
      customChartsEditors: null,
      reason: "not this frontend reference workload; no zero-valued substitute",
    },
    releaseApproval: null,
  });
  if (result.failures.length)
    throw new Error("E_REFERENCE_BUDGET_FAILURE_RETAINED");
}
function bundleFacts(ctx, built) {
  const chunks = json(ctx.root, "wp14-bundle.json").chunks,
    renderedModuleLengths = { own: 0, peers: 0, harness: 0, bundler: 0 };
  for (const chunk of Object.values(chunks))
    for (const [id, value] of Object.entries(chunk.modules ?? {})) {
      demand(
        Number.isSafeInteger(value.renderedLength) && value.renderedLength >= 0,
        "E_MODULE_LENGTH",
      );
      const group = id.startsWith("\0")
        ? "bundler"
        : /\/node_modules\/@tableweave\/(react|heroui)\//.test(id)
          ? "own"
          : id.startsWith(`${ctx.root}/wp14-source/`)
            ? "harness"
            : "peers";
      renderedModuleLengths[group] += value.renderedLength;
    }
  const outputs = {};
  for (const file of Object.keys(built.files))
    if (/^wp14-dist\/.*\.(js|css)$/.test(file)) {
      const bytes = read(ctx.root, file);
      outputs[file] = {
        bytes: bytes.length,
        gzipBytes: gzipSync(bytes).length,
        sha256: record(ctx.root, file).sha256,
      };
    }
  return {
    graph: built.graph,
    archives: ctx.archivePair,
    outputs,
    renderedModuleLengths,
    attribution:
      "Rollup rendered module lengths, NOT independently gzippable ownership; complete chunk/CSS raw and gzip bytes separate",
    numericBudget: null,
    optional: { status: "BLOCKED_UNMEASURED", bytes: null },
  };
}
function readSamples(run, id) {
  const value = JSON.parse(readText(run, `measurement/${id}/samples.json`));
  demand(Array.isArray(value), "E_RAW_SAMPLES");
  return value;
}
import { read } from "./candidate.mjs";
function readText(root, file) {
  return read(root, file).toString("utf8");
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  demand(
    args.length === 4 && args[0] === "--inputs" && args[2] === "--run",
    "E_EXPLICIT_ARGUMENTS",
  );
  report(args[1], args[3]);
}
