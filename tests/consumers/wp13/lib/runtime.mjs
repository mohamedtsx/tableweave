import fs from "node:fs";
import path from "node:path";
import {
  demand,
  object,
  receipt,
  regular,
  json,
  digest,
  verifyMap,
  tree,
  record,
  capacity,
  present,
  relative,
  directory,
} from "./receipts.mjs";
import { local, revalidate, ownedConsumer } from "./boundary.mjs";
import { installed, nativeInputs } from "./installer.mjs";
import { toolchain, producerInputs, execute } from "./generation.mjs";

export function expectedCases(family, variant) {
  if (family === "next")
    return [
      "next-neutral-flight",
      "next-independent-reattach",
      "next-headless",
      ...(variant === "rsc-negative" ? ["next-rsc-rejection"] : []),
    ];
  if (family === "start")
    return ["start-neutral-canaries", "start-hydrated-query"];
  demand(["vite-headless", "vite-styled"].includes(family), "E_RUNTIME_FAMILY");
  return [
    "vite-dom-transition",
    family === "vite-headless"
      ? "vite-headless-isolation"
      : "vite-computed-style",
  ];
}
export function validateReport(report, attempt, inputSHA256) {
  object(report);
  demand(
    typeof report.browserVersion === "string" &&
      /^\d+\.[0-9.]+$/.test(report.browserVersion),
    "E_RUNTIME_MISSING_BROWSER_OBSERVATION",
  );
  demand(
    report.schema === "wp13-family-observations-v1" &&
      report.inputSHA256 === inputSHA256 &&
      report.status === "observed" &&
      report.completed === true,
    "E_RUNTIME_INCOMPLETE_REPORT",
  );
  for (const key of [
    "run",
    "key",
    "candidate",
    "family",
    "profile",
    "variant",
    "attempt",
    "buildSHA256",
    "installedSHA256",
    "browserSHA256",
    "planSHA256",
  ])
    demand(report[key] === attempt[key], "E_RUNTIME_REPORT_BINDING");
  demand(
    report.serverStarted === true &&
      report.serverExited === true &&
      report.cleanupDebt === null &&
      report.primaryFailure === null &&
      report.truncated === false &&
      report.unexpectedErrors === 0 &&
      report.unexpectedNetwork === 0,
    "E_RUNTIME_FAILURE_OR_CLEANUP_DEBT",
  );
  const expected = expectedCases(attempt.family, attempt.variant);
  demand(
    Array.isArray(report.cases) &&
      report.cases.length === expected.length &&
      new Set(report.cases.map((value) => value.id)).size === expected.length,
    "E_RUNTIME_EMPTY_OR_DUPLICATE_CASES",
  );
  for (const id of expected) {
    const item = report.cases.find((value) => value.id === id);
    object(item);
    object(item.observed);
    demand(
      item.status === "observed" &&
        Number.isFinite(item.durationMs) &&
        item.durationMs >= 0 &&
        Object.keys(item.observed).length > 0,
      "E_RUNTIME_CASE_NOT_OBSERVED",
    );
    const m = item.observed;
    if (id === "vite-dom-transition")
      demand(
        m.beforeRows > 0 &&
          m.afterRows > 0 &&
          m.firstGone === true &&
          m.targetVisible === true,
        "E_RUNTIME_DOM_EVIDENCE",
      );
    if (id === "vite-headless-isolation")
      demand(
        m.styleSheets === 0 && m.styleNodes === 0 && m.sourceRequests === 0,
        "E_RUNTIME_HEADLESS_EVIDENCE",
      );
    if (id === "vite-computed-style")
      demand(
        m.styleSheets > 0 &&
          m.display === "grid" &&
          m.columnGapPx > 0 &&
          m.sourceRequests === 0,
        "E_RUNTIME_STYLE_EVIDENCE",
      );
    if (id === "next-neutral-flight")
      demand(
        m.htmlStatus === 200 &&
          m.htmlTables === 0 &&
          m.flightStatus === 200 &&
          m.flightComponentType === true &&
          m.serializedInputs === true,
        "E_RUNTIME_FLIGHT_EVIDENCE",
      );
    if (id === "next-independent-reattach")
      demand(
        m.primaryRows === 10 &&
          m.comparisonRows === 10 &&
          m.primaryPage === 2 &&
          m.comparisonPage === 1 &&
          m.reattachedRows > 0,
        "E_RUNTIME_NEXT_DOM_EVIDENCE",
      );
    if (id === "next-headless")
      demand(
        m.primaryStatus === 200 &&
          m.comparisonStatus === 200 &&
          m.independentInstances === true &&
          m.noStore === true,
        "E_RUNTIME_GET_EVIDENCE",
      );
    if (id === "next-rsc-rejection")
      demand(
        m.httpStatus === 500 &&
          m.frameworkMessage === "callback-client-boundary" &&
          m.callbackNamed === true &&
          m.logWindowBytes > 0,
        "E_RUNTIME_NOT_GENUINE_RSC_REJECTION",
      );
    if (id === "start-neutral-canaries")
      demand(
        m.alphaStatus === 200 &&
          m.betaStatus === 200 &&
          m.alphaOnly === true &&
          m.betaOnly === true &&
          m.distinctBootstrap === true &&
          m.neutralTables === 0 &&
          m.responsesConsumed === true,
        "E_RUNTIME_CANARY_EVIDENCE",
      );
    if (id === "start-hydrated-query")
      demand(
        m.alphaTables === 2 &&
          m.betaTables === 2 &&
          m.queryTarget === true &&
          m.oldRowGone === true &&
          m.otherDomainRetained === true &&
          m.betaRetained === true &&
          m.freshReadCount === "not-proved",
        "E_RUNTIME_START_DOM_EVIDENCE",
      );
  }
  return report;
}
export function verifyBuild(target, built, ctx) {
  demand(
    built.candidate === ctx.request.candidate &&
      built.key === ctx.key &&
      built.profile === ctx.profile &&
      built.port === 6575 &&
      built.reuseExistingServer === false,
    "E_RUNTIME_BUILD_RECEIPT_BINDING",
  );
  const allowed =
    ctx.family === "next"
      ? [".next"]
      : ctx.family === "start"
        ? ["dist", ".output"]
        : ["wp13-family-build"];
  demand(
    Array.isArray(built.outputRoots) &&
      built.outputRoots.length > 0 &&
      new Set(built.outputRoots).size === built.outputRoots.length &&
      built.outputRoots.every((root) => allowed.includes(root)),
    "E_RUNTIME_OUTPUT_ROOTS",
  );
  const actual = {};
  for (const root of built.outputRoots)
    for (const [file, value] of Object.entries(tree(path.join(target, root))))
      actual[`${root}/${file}`] = value;
  demand(
    Object.keys(actual).length > 0 &&
      JSON.stringify(Object.keys(actual).sort()) ===
        JSON.stringify(Object.keys(object(built.output)).sort()),
    "E_RUNTIME_UNSELECTED_BUILT_FILE",
  );
  for (const file of Object.keys(built.output)) relative(file);
  verifyMap(target, built.output);
  const entry =
    ctx.family === "start"
      ? "dist/server/server.js"
      : ctx.family === "next"
        ? ".next/BUILD_ID"
        : `wp13-family-build/${ctx.family === "vite-headless" ? "headless" : "index"}.html`;
  demand(
    Object.hasOwn(built.output, entry),
    ctx.family === "start"
      ? "E_START_PUBLIC_BUILT_FETCH_CONTRACT_REQUIRED"
      : "E_RUNTIME_MISSING_BUILT_ENTRY",
  );
}
export function freshRuntimeOutput(target) {
  directory(target);
  demand(
    !present(path.join(target, "wp13-runtime")),
    "E_RUNTIME_ATTEMPT_OVERWRITE",
  );
}
export function runFamily(ctx) {
  demand(ctx.phase === "family-runtime", "E_RUNTIME_PHASE");
  revalidate(ctx);
  toolchain(ctx);
  producerInputs(ctx);
  const state = installed(ctx),
    target = state.target,
    native = nativeInputs(ctx, target),
    built = receipt(ctx, `family-build-${ctx.key}.json`);
  verifyBuild(target, built, ctx);
  const plan = receipt(ctx, `runtime-plan-${ctx.key}.json`),
    browser = receipt(ctx, `browser-inputs-${ctx.key}.json`),
    selected = receipt(ctx, `runtime-attempt-${ctx.key}.json`);
  demand(
    plan.status === "main-reviewed-family-runtime" &&
      plan.run === ctx.runId &&
      plan.candidate === ctx.request.candidate &&
      plan.key === ctx.key &&
      plan.family === ctx.family &&
      plan.profile === ctx.profile &&
      plan.workers === 1 &&
      plan.retries === 0 &&
      plan.port === 6575 &&
      plan.host === "127.0.0.1",
    "E_HOLD_RUNTIME_PLAN_SELECTION",
  );
  const variant = ctx.family === "next" ? ctx.request.nextCase : "ordinary";
  demand(
    ["ordinary", "rsc-negative"].includes(variant) &&
      plan.variant === variant &&
      (ctx.family !== "next" || built.nextCase === variant),
    "E_RUNTIME_CASE_VARIANT",
  );
  demand(
    browser.status === "main-reviewed-local-chromium" &&
      browser.run === ctx.runId &&
      browser.candidate === ctx.request.candidate &&
      browser.playwrightVersion === "1.65.1" &&
      browser.key === ctx.key &&
      browser.directory === "node_modules/.wp13-browser" &&
      browser.executable.startsWith(`${browser.directory}/`),
    "E_HOLD_OWNED_BROWSER_SELECTION",
  );
  relative(browser.executable);
  for (const file of Object.keys(object(browser.files))) {
    relative(file);
    demand(file.startsWith(`${browser.directory}/`), "E_BROWSER_MAP_PATH");
  }
  verifyMap(target, browser.files);
  const browserActual = tree(path.join(target, browser.directory));
  demand(
    JSON.stringify(Object.keys(browserActual).sort()) ===
      JSON.stringify(
        Object.keys(browser.files)
          .map((file) => {
            relative(file);
            demand(
              file.startsWith(`${browser.directory}/`),
              "E_BROWSER_MAP_PATH",
            );
            return file.slice(browser.directory.length + 1);
          })
          .sort(),
      ),
    "E_BROWSER_MAP_INCOMPLETE",
  );
  demand(
    Object.hasOwn(browser.files, browser.executable) &&
      local(target, browser.executable) ===
        path.join(target, browser.executable) &&
      (fs.statSync(path.join(target, browser.executable)).mode & 0o111) !== 0,
    "E_BROWSER_EXECUTABLE",
  );
  const playwright = local(
    target,
    "node_modules/@playwright/test/package.json",
  );
  demand(
    Object.hasOwn(state.installed.inputs, path.relative(target, playwright)),
    "E_PLAYWRIGHT_NOT_IN_INSTALLED_MAP",
  );
  demand(
    JSON.parse(fs.readFileSync(playwright)).version === "1.65.1",
    "E_CONSUMER_LOCAL_PLAYWRIGHT",
  );
  if (ctx.profile !== "ordinary") {
    const profile = receipt(ctx, `profile-verified-${ctx.key}.json`);
    demand(
      profile.status ===
        "explicit-profile-assets-and-selected-installed-bytes-only" &&
        profile.profile === ctx.profile &&
        profile.ordinaryUnchanged === true,
      "E_RUNTIME_EXPLICIT_PROFILE_NOT_VERIFIED",
    );
  }
  const planSHA256 = digest(regular(ctx.run, `runtime-plan-${ctx.key}.json`));
  demand(
    selected.status === "main-reviewed-fresh-runtime-attempt" &&
      selected.key === ctx.key &&
      selected.candidate === ctx.request.candidate &&
      selected.planSHA256 === planSHA256 &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        selected.attempt,
      ) &&
      selected.outputDirectory === "wp13-runtime",
    "E_RUNTIME_ATTEMPT_SELECTION",
  );
  freshRuntimeOutput(target);
  for (const [source, destination] of [
    ["family-runtime.mjs", "wp13-family-runtime.mjs"],
    ["start-host.mjs", "wp13-start-host.mjs"],
  ])
    demand(
      digest(regular(target, destination)) ===
        digest(
          regular(ctx.producer, `tests/consumers/wp13/fixtures/${source}`),
        ),
      "E_RUNTIME_RUNNER_SOURCE",
    );
  const attempt = {
    schema: "wp13-family-attempt-v1",
    run: ctx.runId,
    key: ctx.key,
    candidate: ctx.request.candidate,
    family: ctx.family,
    profile: ctx.profile,
    variant,
    attempt: selected.attempt,
    planSHA256,
    buildSHA256: digest(regular(ctx.run, `family-build-${ctx.key}.json`)),
    installedSHA256: digest(regular(ctx.run, `installed-${ctx.key}.json`)),
    browserSHA256: digest(regular(ctx.run, `browser-inputs-${ctx.key}.json`)),
    browserExecutable: browser.executable,
    browserFiles: browser.files,
    buildFiles: built.output,
    buildRoots: built.outputRoots,
    preparedFiles: state.frozen.files,
    installedFiles: state.installed.inputs,
    nativeFiles: native,
    controlHashes: ctx.controls,
  };
  capacity(target);
  fs.mkdirSync(path.join(target, "wp13-runtime"));
  directory(path.join(target, "wp13-runtime"));
  record(target, "wp13-runtime/attempt.json", attempt);
  const inputSHA256 = digest(regular(target, "wp13-runtime/attempt.json"));
  let failure = null,
    report;
  function abort(error, message) {
    return failure === null
      ? error
      : new AggregateError([failure, error], message);
  }
  try {
    execute(ctx, "family-runtime");
  } catch (error) {
    // Only this fixed execute outcome proves an ordinary logged child failure.
    // Other errors may already report lost identity; never resume cached reads.
    if (
      !(error instanceof Error) ||
      error instanceof AggregateError ||
      error.message !== "E_CHILD_FAILURE_RETAINED"
    )
      throw error;
    failure = error;
  }
  try {
    revalidate(ctx);
    demand(ownedConsumer(ctx) === target, "E_RUNTIME_CONSUMER_TARGET");
  } catch (error) {
    throw abort(error, "E_RUNTIME_CHILD_AND_REPORT_BOUNDARY_FAILURE");
  }
  if (failure === null)
    try {
      report = validateReport(
        json(target, "wp13-runtime/report.json"),
        attempt,
        inputSHA256,
      );
    } catch (error) {
      failure = error;
    }
  try {
    revalidate(ctx);
    demand(ownedConsumer(ctx) === target, "E_RUNTIME_CONSUMER_TARGET");
    toolchain(ctx);
    producerInputs(ctx);
    installed(ctx);
    verifyBuild(target, built, ctx);
    verifyMap(target, native);
    verifyMap(target, browser.files);
    demand(
      digest(regular(target, "wp13-runtime/attempt.json")) === inputSHA256,
      "E_RUNTIME_ATTEMPT_REPLACED",
    );
    revalidate(ctx);
    demand(ownedConsumer(ctx) === target, "E_RUNTIME_CONSUMER_TARGET");
  } catch (error) {
    // Any failed postflight aborts: no retry, inventory, or result receipt.
    throw abort(error, "E_RUNTIME_PRIMARY_AND_POSTFLIGHT_FAILURE");
  }
  try {
    const files = Object.fromEntries(
      Object.entries(tree(path.join(target, "wp13-runtime"))).map(
        ([file, value]) => [`wp13-runtime/${file}`, value],
      ),
    );
    revalidate(ctx);
    demand(ownedConsumer(ctx) === target, "E_RUNTIME_CONSUMER_TARGET");
    record(ctx.run, `runtime-result-${ctx.key}.json`, {
      status: failure
        ? "failed-runtime-observations"
        : "observed-runtime-smoke-only",
      candidate: ctx.request.candidate,
      key: ctx.key,
      profile: ctx.profile,
      report: report ?? null,
      failure: failure instanceof Error ? failure.message : null,
      files,
      limits: [
        "not full WP11/12/13 acceptance",
        "fresh-cache read count not proved",
        "not Safari/mobile/AT/security/performance",
        "drag/G02 blocked",
      ],
    });
  } catch (error) {
    throw abort(error, "E_RUNTIME_PRIMARY_AND_INVENTORY_OR_RECEIPT_FAILURE");
  }
  if (failure) throw failure;
  return {
    status: "observed-runtime-smoke-only",
    cases: report.cases.map((value) => value.id),
    completeWP13: false,
  };
}
