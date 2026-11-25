/** Actual production fixture driver. FINAL only, explicit CLI; no import effects. */
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import {
  capacity,
  demand,
  directory,
  hash,
  json,
  object,
  put,
  read,
  record,
  relative,
  runner,
  safeEnvironment,
  selectCandidate,
  verifyMap,
  write,
} from "./candidate.mjs";
import { scenarioIds } from "./statistics.mjs";
const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
export const FILES = [
  "README.md",
  "fixture.ts",
  "schema.ts",
  "definition.ts",
  "source.ts",
  "scenarios.ts",
  "timing.ts",
  "Benchmark.tsx",
  "main.tsx",
  "index.html",
  "styles.css",
  "vite.config.ts",
  "playwright.config.ts",
  "candidate.mjs",
  "driver.mjs",
  "statistics.mjs",
  "statistics.test.ts",
  "report.mjs",
  "tsconfig.source-light.json",
  "light.mjs",
  "static.mjs",
  "scope.mjs",
  "inputs.mjs",
  "seal.mjs",
];
const FRONTEND = [
  "fixture.ts",
  "schema.ts",
  "definition.ts",
  "source.ts",
  "scenarios.ts",
  "timing.ts",
  "Benchmark.tsx",
  "main.tsx",
  "index.html",
  "styles.css",
  "vite.config.ts",
];
const SCHEDULER = "committed-dom-double-raf-message-task-v1";
export const OWNED_WAIT_MS = 30_000;
/** Deadline snapshot is permanent. Late settlement is consumed, never a success upgrade. */
export function boundedOwnedWait(label, task, milliseconds = OWNED_WAIT_MS) {
  demand(
    typeof label === "string" &&
      typeof task === "function" &&
      Number.isSafeInteger(milliseconds) &&
      milliseconds > 0 &&
      milliseconds <= OWNED_WAIT_MS,
    "E_OWNED_DEADLINE",
  );
  return new Promise((resolve) => {
    let decided = false;
    const finish = (status, pendingAtDeadline = false, failureCode = null) => {
      if (decided) return;
      decided = true;
      clearTimeout(timer);
      resolve(
        Object.freeze({
          label,
          status,
          deadlineMs: milliseconds,
          pendingAtDeadline,
          failureCode,
        }),
      );
    };
    const timer = setTimeout(() => finish("timeout", true), milliseconds);
    Promise.resolve()
      .then(task)
      .then(
        () => finish("completed"),
        (error) =>
          finish(
            "failed",
            false,
            error instanceof Error && /^E_[A-Z0-9_]{1,96}$/.test(error.message)
              ? error.message
              : "E_OWNED_OPERATION_FAILED",
          ),
      );
  });
}
export async function runOwnedCleanup(steps, milliseconds = OWNED_WAIT_MS) {
  const attempts = [];
  for (const step of steps)
    attempts.push(
      await boundedOwnedWait(step.label, step.action, milliseconds),
    );
  return Object.freeze({
    attempts: Object.freeze(attempts),
    debts: Object.freeze(
      attempts.filter((value) => value.status !== "completed"),
    ),
  });
}
function ownedFailure(debts, attempts = debts) {
  const error = new Error("E_OWNED_LIFECYCLE_DEBT");
  error.ownedDebts = Object.freeze([...debts]);
  error.ownedAttempts = Object.freeze([...attempts]);
  return error;
}
export function retainPrimary(primary, fallback) {
  return primary ?? fallback;
}
async function requireOwnedWait(label, task) {
  const result = await boundedOwnedWait(label, task);
  if (result.status !== "completed") throw ownedFailure([result]);
}
export async function finishOwnedTrace(
  cdp,
  completion,
  milliseconds = OWNED_WAIT_MS,
) {
  return runOwnedCleanup(
    [
      { label: "trace-end", action: () => cdp.send("Tracing.end") },
      {
        label: "trace-completion",
        action: () => {
          demand(
            completion && typeof completion.then === "function",
            "E_TRACE_COMPLETION_UNAVAILABLE",
          );
          return completion;
        },
      },
      { label: "trace-detach", action: () => cdp.detach() },
    ],
    milliseconds,
  );
}
export async function closeOwnedContext(
  context,
  browser,
  milliseconds = OWNED_WAIT_MS,
) {
  const first = await runOwnedCleanup(
    [{ label: "browser-context-close", action: () => context.close() }],
    milliseconds,
  );
  if (!first.debts.length || !browser) return first;
  const fallback = await runOwnedCleanup(
    [{ label: "owned-browser-close-fallback", action: () => browser.close() }],
    milliseconds,
  );
  return Object.freeze({
    attempts: Object.freeze([...first.attempts, ...fallback.attempts]),
    debts: Object.freeze([...first.debts, ...fallback.debts]),
  });
}
export async function closeOwnedServer(server, milliseconds = OWNED_WAIT_MS) {
  const closed = new Promise((resolve, reject) => {
    try {
      server.close((error) => (error ? reject(error) : resolve()));
    } catch (error) {
      reject(error);
    }
  });
  // Attach immediately, even if closeIdleConnections throws independently.
  closed.catch(() => {});
  const first = await runOwnedCleanup(
    [
      { label: "http-close-idle", action: () => server.closeIdleConnections() },
      { label: "http-close", action: () => closed },
    ],
    milliseconds,
  );
  if (!first.debts.length) return first;
  const fallback = await runOwnedCleanup(
    [
      {
        label: "http-close-owned-connections",
        action: () => server.closeAllConnections(),
      },
      { label: "http-close-after-fallback", action: () => closed },
    ],
    milliseconds,
  );
  return Object.freeze({
    attempts: Object.freeze([...first.attempts, ...fallback.attempts]),
    debts: Object.freeze([...first.debts, ...fallback.debts]),
  });
}
function tree(root) {
  const result = {};
  function visit(prefix) {
    for (const item of fs.readdirSync(path.join(root, prefix), {
      withFileTypes: true,
    })) {
      const file = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.isDirectory()) visit(file);
      else {
        demand(item.isFile() && !item.isSymbolicLink(), "E_OUTPUT_LINK");
        result[file] = record(root, file);
      }
    }
  }
  visit("");
  return result;
}
function fixture(ctx) {
  demand(
    JSON.stringify(Object.keys(ctx.input.fixtureFiles).sort()) ===
      JSON.stringify([...FILES].sort()),
    "E_EXACT_FIXTURE_INPUTS",
  );
  verifyMap(sourceRoot, ctx.input.fixtureFiles);
  const infrastructureRoot = directory(ctx.input.infrastructureRoot);
  demand(
    sourceRoot === path.join(infrastructureRoot, "tests/benchmarks/wp14"),
    "E_EXECUTING_TOOLING_ROOT",
  );
  verifyMap(infrastructureRoot, ctx.input.infrastructureFiles);
  for (const file of [
    "tests/consumers/wp13/lib/archive.mjs",
    "tests/consumers/wp13/lib/receipts.mjs",
  ])
    demand(
      Object.hasOwn(ctx.input.infrastructureFiles, file),
      "E_INERT_HELPER_PIN",
    );
  return hash(JSON.stringify(ctx.input.fixtureFiles));
}
function runIdentity(ctx, run) {
  directory(run);
  demand(
    path.dirname(run) === "/tmp/opencode" &&
      path.basename(run) === `wp14-run-${ctx.selection.run}`,
    "E_OWNED_RUN_ROOT",
  );
  const owner = json(run, "owner.json");
  demand(
    owner.run === ctx.selection.run &&
      owner.status === "wp14-exclusive-run" &&
      owner.materializationSHA256 === ctx.selection.materialization.sha256 &&
      owner.candidate === ctx.identity,
    "E_RUN_OWNER",
  );
  if (owner.selectionSHA256 !== ctx.selectionSHA256) {
    const selected = ctx.selection.buildSelection;
    demand(
      selected?.sha256 === owner.selectionSHA256,
      "E_ORIGINAL_BUILD_SELECTION",
    );
    const bytes = read(
      path.dirname(selected.path),
      path.basename(selected.path),
    );
    demand(hash(bytes) === selected.sha256, "E_BUILD_SELECTION_BYTES");
    const before = object(JSON.parse(bytes.toString("utf8")));
    demand(
      before.status === "main-reviewed-wp14-final-selection" &&
        before.owner === "main" &&
        before.run === ctx.selection.run &&
        before.materialization.sha256 === ctx.selection.materialization.sha256,
      "E_BUILD_SELECTION_LINK",
    );
  }
}
export function actualBuild(ctx, run) {
  runIdentity(ctx, run);
  const value = json(run, "build.json");
  demand(
    value.candidate === ctx.identity &&
      value.protocol === fixture(ctx) &&
      value.status === "actual-fixture-production-build-not-runtime-proof",
    "E_BUILD_RECEIPT",
  );
  verifyMap(ctx.root, value.files);
  return value;
}
export function build(ctx, output) {
  const protocol = fixture(ctx);
  demand(
    path.isAbsolute(output) &&
      path.dirname(output) === "/tmp/opencode" &&
      path.basename(output) === `wp14-run-${ctx.selection.run}` &&
      !fs.existsSync(output),
    "E_FRESH_OUTPUT",
  );
  for (const name of [
    "wp14-source",
    "wp14-dist",
    "wp14-cache",
    "wp14-bundle.json",
  ])
    demand(!fs.existsSync(path.join(ctx.root, name)), "E_FRESH_FIXTURE_TARGET");
  capacity("/tmp/opencode");
  fs.mkdirSync(output);
  put(output, "owner.json", {
    status: "wp14-exclusive-run",
    run: ctx.selection.run,
    selectionSHA256: ctx.selectionSHA256,
    materializationSHA256: ctx.selection.materialization.sha256,
    candidate: ctx.identity,
  });
  fs.mkdirSync(path.join(ctx.root, "wp14-source"));
  for (const file of FRONTEND)
    write(ctx.root, `wp14-source/${file}`, read(sourceRoot, file));
  const executable = fs.realpathSync(
    path.join(ctx.root, "node_modules/vite/bin/vite.js"),
  );
  demand(executable.startsWith(`${ctx.root}/node_modules/`), "E_VITE_LOCAL");
  const args = [executable, "build", "--config", "wp14-source/vite.config.ts"];
  const result = spawnSync(process.execPath, args, {
    cwd: ctx.root,
    env: safeEnvironment(ctx),
    shell: false,
    encoding: "utf8",
    timeout: 480000,
    maxBuffer: 8 * 1024 * 1024,
  });
  write(output, "build.log", `${result.stdout ?? ""}${result.stderr ?? ""}`);
  put(output, "build-command.json", {
    executable: process.execPath,
    args,
    status: result.status,
    signal: result.signal,
  });
  demand(result.status === 0 && !result.error, "E_BUILD_FAILURE_RETAINED");
  const observations = json(ctx.root, "wp14-bundle.json");
  for (const chunk of Object.values(observations.chunks))
    for (const name of Object.keys(chunk.modules ?? {})) {
      demand(!/dnd-kit|\/sortable\//.test(name), "E_BLOCKED_OPTIONAL_MODULE");
      if (name.startsWith("\0")) {
        demand(
          name === "\0vite/preload-helper.js" ||
            name === "\0commonjsHelpers.js" ||
            (name.endsWith("?commonjs-proxy") &&
              name.slice(1).startsWith(`${ctx.root}/`)),
          "E_UNREVIEWED_VIRTUAL_MODULE",
        );
        continue;
      }
      const file = name.split("?")[0];
      demand(path.isAbsolute(file), "E_MODULE_ID");
      const actual = fs.realpathSync(file);
      demand(actual.startsWith(`${ctx.root}/`), "E_BUNDLE_HOST_FALLBACK");
      const rel = path.relative(ctx.root, actual);
      demand(
        (Object.hasOwn(ctx.input.fixtureFiles, path.basename(rel)) &&
          rel.startsWith("wp14-source/")) ||
          Object.hasOwn(ctx.installedFiles, rel),
        "E_MODULE_NOT_PINNED",
      );
    }
  const files = Object.fromEntries([
    ...Object.entries(tree(path.join(ctx.root, "wp14-source"))).map(
      ([key, value]) => [`wp14-source/${key}`, value],
    ),
    ...Object.entries(tree(path.join(ctx.root, "wp14-dist"))).map(
      ([key, value]) => [`wp14-dist/${key}`, value],
    ),
    ["wp14-bundle.json", record(ctx.root, "wp14-bundle.json")],
  ]);
  if (fs.existsSync(path.join(ctx.root, "wp14-cache"))) {
    for (const [file, value] of Object.entries(
      tree(path.join(ctx.root, "wp14-cache")),
    ))
      files[`wp14-cache/${file}`] = value;
  }
  ctx.revalidate();
  demand(fixture(ctx) === protocol, "E_FIXTURE_CHANGED_DURING_BUILD");
  put(output, "build.json", {
    status: "actual-fixture-production-build-not-runtime-proof",
    candidate: ctx.identity,
    protocol,
    selectionSHA256: ctx.selectionSHA256,
    files,
    graph: record(ctx.root, "wp14-bundle.json"),
    archives: ctx.archivePair,
    profile: ctx.input.profile,
  });
}
async function serve(ctx, built) {
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1:6576"),
        name =
          url.pathname === "/"
            ? "index.html"
            : decodeURIComponent(url.pathname.slice(1));
      relative(name);
      demand(
        Object.hasOwn(built.files, `wp14-dist/${name}`),
        "E_UNSELECTED_ASSET",
      );
      const bytes = read(ctx.root, `wp14-dist/${name}`);
      demand(
        hash(bytes) === built.files[`wp14-dist/${name}`].sha256,
        "E_ASSET_CHANGED",
      );
      response.writeHead(200, {
        "Content-Type": name.endsWith(".html")
          ? "text/html"
          : name.endsWith(".js")
            ? "text/javascript"
            : name.endsWith(".css")
              ? "text/css"
              : "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end("Unselected production asset");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 6576, exclusive: true }, resolve);
  });
  return async () => {
    const cleanup = await closeOwnedServer(server);
    if (cleanup.debts.length)
      throw ownedFailure(cleanup.debts, cleanup.attempts);
  };
}
export function paintReview(ctx, run, built) {
  demand(ctx.selection.paintReview, "E_HOLD_PAINT_REVIEW");
  const bytes = read(
    path.dirname(ctx.selection.paintReview.path),
    path.basename(ctx.selection.paintReview.path),
  );
  demand(
    hash(bytes) === ctx.selection.paintReview.sha256,
    "E_PAINT_REVIEW_HASH",
  );
  const review = object(JSON.parse(bytes.toString("utf8"))),
    validation = json(run, "validation/observations.json");
  demand(
    review.status === "main-reviewed-wp14-paint-validation" &&
      review.reviewer &&
      review.candidate === ctx.identity &&
      review.runner === ctx.selection.runner.sha256 &&
      review.protocol === built.protocol &&
      review.scheduler === SCHEDULER &&
      review.validationSHA256 ===
        record(run, "validation/observations.json").sha256 &&
      review.buildSHA256 === record(run, "build.json").sha256,
    "E_HOLD_PAINT_CORRELATION",
  );
  verifyMap(run, validation.files);
  demand(
    review.paths.length === 48 &&
      new Set(review.paths.map((value) => value.path)).size === 48 &&
      validation.paths.length === 48,
    "E_ALL_PAINT_PATHS",
  );
  const expectedPaths = scenarioIds
    .flatMap((id) => [`${id}:0`, `${id}:1`])
    .sort();
  demand(
    JSON.stringify(validation.paths.map((value) => value.path).sort()) ===
      JSON.stringify(expectedPaths) &&
      JSON.stringify(review.paths.map((value) => value.path).sort()) ===
        JSON.stringify(expectedPaths),
    "E_EXACT_PAINT_PATH_COVERAGE",
  );
  for (const value of validation.paths) {
    const approval = review.paths.find((item) => item.path === value.path);
    demand(
      [value.frame, value.paint, value.witness, value.endpoint].every(
        (mark) => typeof mark === "number" && Number.isFinite(mark),
      ) &&
        value.witness >= 0 &&
        value.endpoint > value.witness &&
        value.frame >= value.witness &&
        value.frame <= value.endpoint &&
        value.paint >= value.witness &&
        value.paint <= value.endpoint &&
        approval?.status === "paint-and-matching-rendered-frame-reviewed" &&
        approval.traceSHA256 === value.traceSHA256 &&
        approval.frameSHA256 === value.frameSHA256 &&
        approval.witness === value.witness &&
        approval.endpoint === value.endpoint,
      "E_HOLD_FRAME_REVIEW",
    );
  }
  return ctx.selection.paintReview.sha256;
}
function scopes(run, session) {
  const result = {};
  for (const id of scenarioIds) {
    let value = 2166136261;
    for (const char of `${run}:${session}:${id}`)
      value = Math.imul(value ^ char.charCodeAt(0), 16777619);
    result[id] = (value >>> 0).toString(16).padStart(8, "0");
  }
  return result;
}
async function oneSample(page, scenario, context, direction, fresh) {
  if (fresh)
    await page.evaluate(
      ({ scenario, context, direction }) =>
        window.wp14.start(scenario, context, direction),
      { scenario, context, direction },
    );
  if (scenario.kind !== "initial") {
    await page.evaluate(
      (direction) => window.wp14.prepare(direction),
      direction,
    );
    await page.waitForFunction(() => window.wp14.ready(), null, {
      timeout: 120000,
    });
    await page.evaluate(
      ({ context, direction }) => window.wp14.run(context, direction),
      { context, direction },
    );
    if (scenario.kind === "typing") {
      const input = page.getByRole("searchbox", {
        name: "Search records",
        exact: true,
      });
      await input.press("ControlOrMeta+A");
      await input.pressSequentially(direction === 0 ? "wp14-001" : "wp14-000", {
        delay: 5,
      });
    }
  }
  await page.waitForFunction(() => window.wp14.read() !== null, null, {
    timeout: 120000,
  });
  return page.evaluate(() => window.wp14.read());
}
async function session(ctx, run, built, index, validation) {
  const observed = runner(ctx);
  demand(observed.spec.protocol === built.protocol, "E_RUNNER_PROTOCOL");
  const id = `${validation ? "validation" : "measurement"}-${index}`,
    output = `${validation ? "validation" : "measurement"}/${id}`;
  fs.mkdirSync(path.join(run, output), { recursive: false });
  fs.mkdirSync(path.join(run, output, "profile"));
  fs.mkdirSync(path.join(run, output, "artifacts"));
  const packageRoot = fs.realpathSync(
      path.join(ctx.root, "node_modules/@playwright/test"),
    ),
    manifest = json(packageRoot, "package.json"),
    target = manifest.exports["."].import;
  demand(
    typeof target === "string" && target.startsWith("./"),
    "E_PLAYWRIGHT_PUBLIC_IMPORT",
  );
  relative(target.slice(2));
  const modulePath = fs.realpathSync(path.join(packageRoot, target.slice(2)));
  demand(
    modulePath.startsWith(`${ctx.root}/node_modules/`),
    "E_PLAYWRIGHT_LOCAL",
  );
  const { chromium } = await import(pathToFileURL(modulePath).href);
  let context = null,
    page = null,
    primary = null,
    cdp = null,
    completeTrace = null,
    sessionResult = null,
    ownedBrowser = null,
    preflight = null,
    traceCleanupAttempted = false;
  const cleanupAttempts = [],
    cleanupDebts = [];
  const trace = [],
    samples = [],
    paths = [],
    errors = [];
  try {
    context = await chromium.launchPersistentContext(
      path.join(run, output, "profile"),
      {
        executablePath: observed.executable,
        args: observed.spec.browser.flags,
        env: observed.env,
        headless: true,
        chromiumSandbox: true,
        viewport: { width: 1440, height: 900 },
        artifactsDir: path.join(run, output, "artifacts"),
        acceptDownloads: false,
        serviceWorkers: "block",
      },
    );
    const browser = context.browser();
    ownedBrowser = browser;
    demand(browser, "E_BROWSER_PROCESS");
    demand(
      browser.version() === observed.spec.browser.engineVersion,
      "E_ACTUAL_ENGINE_VERSION",
    );
    preflight = await browser.newBrowserCDPSession();
    const info = await preflight.send("SystemInfo.getProcessInfo"),
      command = await preflight.send("Browser.getBrowserCommandLine");
    const process = info.processInfo.find((value) => value.type === "browser");
    demand(Number.isSafeInteger(process?.id), "E_BROWSER_PID");
    const normalizedArguments = command.arguments.map((arg) =>
      arg.startsWith("--user-data-dir=")
        ? "--user-data-dir=OWNED_PROFILE"
        : arg,
    );
    demand(
      hash(JSON.stringify(normalizedArguments)) ===
        observed.spec.browser.launchArgumentsSHA256,
      "E_ACTUAL_BROWSER_FLAGS",
    );
    await requireOwnedWait("preflight-detach", () => preflight.detach());
    preflight = null;
    page = context.pages()[0] ?? (await context.newPage());
    page.on("pageerror", () => errors.push("E_UNEXPECTED_PAGE_ERROR"));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push("E_UNEXPECTED_CONSOLE_ERROR");
    });
    const response = await page.goto("http://127.0.0.1:6576/", {
      waitUntil: "load",
    });
    demand(response?.status() === 200, "E_PRODUCTION_DOCUMENT");
    await page.waitForFunction(
      () => typeof window.wp14?.oracles === "function",
    );
    // Independent fixture specification, frozen BEFORE samples; never native output.
    const oracles = await page.evaluate(() => window.wp14.oracles());
    put(run, `${output}/oracles.json`, oracles);
    if (!validation)
      demand(
        record(run, `${output}/oracles.json`).sha256 ===
          json(run, "validation/observations.json").sessions[0].oraclesSHA256,
        "E_ORACLES_CHANGED_SINCE_VALIDATION",
      );
    if (validation) {
      cdp = await context.newCDPSession(page);
      cdp.on("Tracing.dataCollected", (event) => trace.push(...event.value));
      completeTrace = new Promise((resolve) =>
        cdp.once("Tracing.tracingComplete", resolve),
      );
      await requireOwnedWait("trace-start", () =>
        cdp.send("Tracing.start", {
          categories:
            "devtools.timeline,blink.user_timing,disabled-by-default-devtools.screenshot",
          transferMode: "ReportEvents",
        }),
      );
    }
    for (const scenarioId of scenarioIds) {
      const [mode, kind] = scenarioId.split(":"),
        scenario = { id: scenarioId, mode, kind };
      const phases = validation
        ? [["validation", 2]]
        : [
            ["warmup", 10],
            ["measured", [34, 33, 33][index]],
          ];
      let mounted = false;
      for (const [phase, count] of phases)
        for (let ordinal = 0; ordinal < count; ordinal++) {
          const sampleContext = {
            run: ctx.selection.run,
            session: id,
            sessionIndex: index,
            scenario: scenarioId,
            phase,
            ordinal,
            candidate: ctx.identity,
            runner: observed.identity,
            protocol: built.protocol,
          };
          const sample = await oneSample(
            page,
            scenario,
            sampleContext,
            ordinal % 2,
            kind === "initial" || !mounted,
          );
          mounted = true;
          demand(sample && errors.length === 0, "E_SAMPLE_OR_PAGE_FAILURE");
          samples.push(sample);
          if (kind === "initial") {
            await requireOwnedWait("source-end-after-initial", () =>
              page.evaluate(() => window.wp14.end()),
            );
            mounted = false;
          }
        }
      await requireOwnedWait("source-end-after-scenario", () =>
        page.evaluate(() => window.wp14.end()),
      );
    }
    if (validation) {
      traceCleanupAttempted = true;
      const traceCleanup = await finishOwnedTrace(cdp, completeTrace);
      cleanupAttempts.push(...traceCleanup.attempts);
      cleanupDebts.push(...traceCleanup.debts);
      if (traceCleanup.debts.length)
        throw ownedFailure(traceCleanup.debts, traceCleanup.attempts);
      cdp = null;
      const traceBytes = `${JSON.stringify({ traceEvents: trace })}\n`;
      write(run, `${output}/trace.json`, traceBytes);
      const traceSHA256 = hash(traceBytes);
      for (const sample of samples) {
        const prefix = `wp14:${sample.session}:${sample.scenario}:${sample.phase}:${sample.ordinal}`;
        const witness = trace.find(
            (event) => event.name === `${prefix}:witness`,
          ),
          endpoint = trace.find((event) => event.name === `${prefix}:endpoint`);
        demand(
          witness &&
            endpoint &&
            endpoint.ts > witness.ts &&
            Math.abs(
              (endpoint.ts - witness.ts) / 1000 -
                (sample.endpoint - sample.witness),
            ) < 1,
          "E_TRACE_MARK_CORRELATION",
        );
        const paint = trace.find(
          (event) =>
            ["Paint", "DrawFrame"].includes(event.name) &&
            event.ts >= witness.ts &&
            event.ts <= endpoint.ts,
        );
        const frame = trace.find(
          (event) =>
            event.name === "Screenshot" &&
            typeof event.args?.snapshot === "string" &&
            event.ts >= witness.ts &&
            event.ts <= endpoint.ts,
        );
        const frameFile = `${output}/frame-${sample.scenario.replace(":", "-")}-${sample.ordinal}.jpg`;
        let frameSHA256 = null;
        if (frame) {
          const bytes = Buffer.from(frame.args.snapshot, "base64");
          demand(bytes.length > 0, "E_EMPTY_TRACE_FRAME");
          write(run, frameFile, bytes);
          frameSHA256 = hash(bytes);
        }
        paths.push({
          path: `${sample.scenario}:${sample.ordinal}`,
          witness: witness.ts,
          endpoint: endpoint.ts,
          paint: paint?.ts ?? null,
          frame: frame?.ts ?? null,
          traceSHA256,
          frameSHA256,
          frameFile: frame ? frameFile : null,
          status: "PENDING_MAIN_REVIEW_NOT_A_PAINT_PASS",
        });
      }
    }
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    put(run, `${output}/samples.json`, samples);
    const value = {
      id,
      pid: process.id,
      timeOrigin,
      observation: observed.identity,
      observed: observed.observed,
      browserVersion: browser.version(),
      actualArguments: normalizedArguments,
      scopes: scopes(ctx.selection.run, id),
      oraclesSHA256: record(run, `${output}/oracles.json`).sha256,
      files: {
        [`${output}/samples.json`]: record(run, `${output}/samples.json`),
        [`${output}/oracles.json`]: record(run, `${output}/oracles.json`),
      },
      paths,
    };
    if (validation) {
      value.files[`${output}/trace.json`] = record(run, `${output}/trace.json`);
      for (const entry of paths)
        if (entry.frameFile)
          value.files[entry.frameFile] = record(run, entry.frameFile);
    }
    sessionResult = value;
  } catch (error) {
    primary = error;
    if (error instanceof Error) {
      for (const debt of error.ownedDebts ?? [])
        if (!cleanupDebts.includes(debt)) cleanupDebts.push(debt);
      for (const attempt of error.ownedAttempts ?? [])
        if (!cleanupAttempts.includes(attempt)) cleanupAttempts.push(attempt);
    }
    put(run, `${output}/failure.json`, {
      status: "FAILED_RAW_RETAINED",
      code: error instanceof Error ? error.message.slice(0, 100) : "E_FAILURE",
      capturedSamples: samples.length,
      pageErrors: errors,
    });
  } finally {
    const retain = (result) => {
      cleanupAttempts.push(...result.attempts);
      cleanupDebts.push(...result.debts);
    };
    if (page)
      retain(
        await runOwnedCleanup([
          {
            label: "source-end-finally",
            action: () =>
              page.isClosed()
                ? undefined
                : page.evaluate(() => window.wp14?.end()),
          },
        ]),
      );
    if (preflight)
      retain(
        await runOwnedCleanup([
          {
            label: "preflight-detach-finally",
            action: () => preflight.detach(),
          },
        ]),
      );
    if (cdp && !traceCleanupAttempted)
      retain(await finishOwnedTrace(cdp, completeTrace));
    if (context) retain(await closeOwnedContext(context, ownedBrowser));
    if (cleanupDebts.length) {
      primary = retainPrimary(primary, ownedFailure(cleanupDebts));
      put(run, `${output}/cleanup-debt.json`, {
        status: "HOLD_UNRESOLVED_OWNED_CLEANUP_DEBT",
        primary:
          primary instanceof Error ? primary.message.slice(0, 100) : null,
        attempts: cleanupAttempts,
        debts: cleanupDebts,
        lateSettlement:
          "Cannot erase this attempt's failure; no termination or P-purge receipt inferred from timeout/fallback",
        capturedSamples: samples.length,
      });
    }
    if (primary) {
      if (!fs.existsSync(path.join(run, `${output}/failure.json`)))
        put(run, `${output}/failure.json`, {
          status: "FAILED_RAW_RETAINED",
          code:
            primary instanceof Error
              ? primary.message.slice(0, 100)
              : "E_FAILURE",
          capturedSamples: samples.length,
          pageErrors: errors,
        });
      put(run, `${output}/failure-samples.json`, {
        status: "FAILED_PARTIAL_RAW_NOT_MEASUREMENT_APPROVAL",
        samples,
      });
      if (validation && trace.length)
        put(run, `${output}/failure-trace.json`, {
          status: "FAILED_PARTIAL_TRACE_NOT_PAINT_OR_COMPLETION_PROOF",
          traceEvents: trace,
        });
    }
  }
  if (primary) throw primary;
  demand(sessionResult, "E_NO_SESSION_RESULT");
  put(run, `${output}/session.json`, sessionResult);
  return sessionResult;
}
export async function execute(ctx, run, validation) {
  const built = actualBuild(ctx, run),
    mode = validation ? "validation" : "measurement";
  if (!validation) paintReview(ctx, run, built);
  demand(!fs.existsSync(path.join(run, mode)), "E_PHASE_SINGLE_ATTEMPT");
  runner(ctx);
  capacity(run);
  fs.mkdirSync(path.join(run, mode));
  const close = await serve(ctx, built),
    sessions = [];
  let primary = null;
  try {
    for (let index = 0; index < (validation ? 1 : 3); index++) {
      sessions.push(await session(ctx, run, built, index, validation));
      demand(
        fixture(ctx) === built.protocol,
        "E_FIXTURE_CHANGED_DURING_SESSION",
      );
    }
  } catch (error) {
    primary = error;
    put(run, `${mode}/failure.json`, {
      status: "FAILED_RAW_RETAINED",
      code: error instanceof Error ? error.message.slice(0, 100) : "E_FAILURE",
    });
  } finally {
    try {
      await close();
    } catch (error) {
      put(run, `${mode}/server-cleanup-debt.json`, {
        status: "HOLD_UNRESOLVED_OWNED_SERVER_CLEANUP_DEBT",
        primary:
          primary instanceof Error ? primary.message.slice(0, 100) : null,
        debts: error instanceof Error ? (error.ownedDebts ?? []) : [],
        attempts: error instanceof Error ? (error.ownedAttempts ?? []) : [],
        lateSettlement:
          "No success upgrade or process/connection termination inferred from timeout",
      });
      primary = retainPrimary(primary, error);
    }
  }
  if (primary) throw primary;
  ctx.revalidate();
  verifyMap(ctx.root, built.files);
  demand(fixture(ctx) === built.protocol, "E_FIXTURE_CHANGED");
  const files = {};
  for (const value of sessions) {
    Object.assign(files, value.files);
    const rel = `${mode}/${value.id}/session.json`;
    files[rel] = record(run, rel);
  }
  put(run, `${mode}/observations.json`, {
    status: validation
      ? "HOLD_PAINT_REVIEW_REQUIRED"
      : "RAW_MEASUREMENT_NOT_SUMMARY_APPROVAL",
    candidate: ctx.identity,
    runner: ctx.selection.runner.sha256,
    protocol: built.protocol,
    scheduler: SCHEDULER,
    buildSHA256: record(run, "build.json").sha256,
    sessions,
    files,
    paths: sessions.flatMap((value) => value.paths),
  });
}
export async function main(argv) {
  demand(
    argv.length === 5 &&
      ["build", "validate", "measure"].includes(argv[0]) &&
      argv[1] === "--inputs" &&
      argv[3] === (argv[0] === "build" ? "--output" : "--run"),
    "E_EXPLICIT_ARGUMENTS",
  );
  const ctx = selectCandidate(argv[2], argv[0]);
  if (argv[0] === "build") build(ctx, argv[4]);
  else await execute(ctx, argv[4], argv[0] === "validate");
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main(process.argv.slice(2));
