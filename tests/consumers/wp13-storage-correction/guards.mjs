import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

// Inert on import. These authored callbacks have NOT run. Unit tests below
// extract only the actual corrected function/tail and use synthetic dependencies;
// they cannot certify a real issued context, checkout, archive or family runtime.
function finalGate() {
  if (process.env.WP13_STORAGE_CORRECTION_FINAL !== "1")
    throw Error("E_CORRECTION_TESTS_UNSELECTED");
}
export async function registerUnits() {
  finalGate();
  const { test } = await import("node:test");
  const { default: ts } = await import("typescript");
  function source(file, name) {
    const text = fs.readFileSync(file, "utf8");
    const parsed = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    const fn = parsed.statements.find(
      (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
    );
    assert.ok(fn?.body);
    return { text, fn };
  }
  const runtime = source("tests/consumers/wp13/lib/runtime.mjs", "runFamily");
  const first = runtime.fn.body.statements.find(
    (n) =>
      ts.isVariableStatement(n) &&
      n.declarationList.declarations.some(
        (d) => d.name.getText() === "failure",
      ),
  );
  assert.ok(first);
  const tail = runtime.text.slice(first.getStart(), runtime.fn.body.end - 1);
  const consumer = source(
    "tests/consumers/wp13/lib/storage-roots.mjs",
    "consumerStorage",
  );
  const consumerBody = consumer.text.slice(
    consumer.fn.body.getStart() + 1,
    consumer.fn.body.end - 1,
  );
  function runtimeHarness(options = {}) {
    const events = [],
      records = [];
    let boundaries = 0;
    const report = { cases: [{ id: "synthetic-unit-observation" }] };
    const env = {
      ctx: {
        run: "/UNIT/run",
        key: "headless-ordinary",
        request: { candidate: "UNIT-only" },
        profile: "ordinary",
      },
      target: "/UNIT/consumer",
      native: {},
      built: {},
      browser: { files: {} },
      attempt: {},
      inputSHA256: "UNIT-digest",
      path,
      execute() {
        events.push("execute");
        if (options.childError) throw options.childError;
      },
      revalidate() {
        events.push(`boundary-${++boundaries}`);
        if (boundaries === options.failBoundary) throw options.guardError;
      },
      ownedConsumer() {
        events.push("ownedConsumer");
        return options.foreignTarget ? "/UNIT/foreign" : "/UNIT/consumer";
      },
      demand(value, code) {
        if (!value) throw Error(code);
      },
      toolchain() {
        events.push("toolchain");
      },
      producerInputs() {
        events.push("producerInputs");
      },
      installed() {
        events.push("installed");
        if (options.postflightError) throw options.postflightError;
      },
      verifyBuild() {
        events.push("verifyBuild");
      },
      verifyMap() {
        events.push("verifyMap");
      },
      regular() {
        events.push("attempt-read");
        return "UNIT-digest";
      },
      digest(v) {
        return v;
      },
      json() {
        events.push("report-read");
        return report;
      },
      validateReport(value) {
        events.push("validateReport");
        if (options.reportError) throw options.reportError;
        return value;
      },
      tree() {
        events.push("inventory");
        if (options.treeError) throw options.treeError;
        return { "attempt.json": { synthetic: true } };
      },
      record(root, file, value) {
        events.push("result-write");
        if (options.recordError) throw options.recordError;
        records.push({ root, file, value });
      },
    };
    const evaluate = new Function(
      "env",
      `const {ctx,target,native,built,browser,attempt,inputSHA256,path,execute,revalidate,ownedConsumer,demand,toolchain,producerInputs,installed,verifyBuild,verifyMap,regular,digest,json,validateReport,tree,record}=env; return function isolatedRuntimeTail(){${tail}};`,
    );
    return { run: evaluate(env), events, records };
  }
  function combined(thunk, a, b) {
    assert.throws(
      thunk,
      (error) =>
        error instanceof AggregateError &&
        error.errors.length === 2 &&
        error.errors[0] === a &&
        error.errors[1] === b,
    );
  }
  for (const kind of ["child", "report"])
    test(`UNIT synthetic ${kind} failure + postflight failure retains both, no inventory/write`, () => {
      const primary = Error(
          kind === "child" ? "E_CHILD_FAILURE_RETAINED" : "UNIT-report-failure",
        ),
        postflight = Error("UNIT-postflight-failure");
      const h = runtimeHarness({
        [kind === "child" ? "childError" : "reportError"]: primary,
        postflightError: postflight,
      });
      combined(h.run, primary, postflight);
      assert.ok(
        !h.events.includes("inventory") && !h.events.includes("result-write"),
      );
      assert.ok(!h.events.includes("verifyBuild"));
    });
  test("UNIT postflight failure without primary aborts with the same error", () => {
    const error = Error("UNIT-input-drift"),
      h = runtimeHarness({ postflightError: error });
    assert.throws(h.run, (e) => e === error);
    assert.ok(
      !h.events.includes("inventory") && !h.events.includes("result-write"),
    );
  });
  for (const kind of ["child", "report"])
    test(`UNIT synthetic ${kind} failure plus lost postflight identity has no further reads`, () => {
      const primary = Error(
        kind === "child" ? "E_CHILD_FAILURE_RETAINED" : "UNIT-report-failure",
      );
      const guard = Error("UNIT-postflight-identity-loss");
      const h = runtimeHarness({
        [kind === "child" ? "childError" : "reportError"]: primary,
        failBoundary: 2,
        guardError: guard,
      });
      combined(h.run, primary, guard);
      assert.equal(h.events.at(-1), "boundary-2");
      assert.ok(
        !h.events.includes("attempt-read") &&
          !h.events.includes("inventory") &&
          !h.events.includes("result-write"),
      );
    });
  test("UNIT ordinary logged child failure with healthy guards preserves failed-observation receipt", () => {
    const error = Error("E_CHILD_FAILURE_RETAINED"),
      h = runtimeHarness({ childError: error });
    assert.throws(h.run, (e) => e === error);
    assert.ok(!h.events.includes("report-read"));
    assert.equal(h.records.length, 1);
    assert.equal(h.records[0].value.status, "failed-runtime-observations");
    assert.equal(h.records[0].value.failure, error.message);
  });
  test("UNIT validation failure with healthy guards preserves original failure and receipt", () => {
    const error = Error("UNIT-invalid-report"),
      h = runtimeHarness({ reportError: error });
    assert.throws(h.run, (e) => e === error);
    assert.equal(h.records[0].value.status, "failed-runtime-observations");
  });
  for (const point of [1, 2, 3])
    test(`UNIT failed identity boundary ${point} aborts without retry/inventory/write`, () => {
      const error = Error("UNIT-identity-lost"),
        h = runtimeHarness({ failBoundary: point, guardError: error });
      assert.throws(h.run, (e) => e === error);
      assert.equal(
        h.events.filter((e) => e.startsWith("boundary-")).length,
        point,
      );
      assert.ok(
        !h.events.includes("inventory") && !h.events.includes("result-write"),
      );
      if (point === 1) assert.ok(!h.events.includes("report-read"));
    });
  test("UNIT ordinary child failure plus report boundary loss preserves both", () => {
    const primary = Error("E_CHILD_FAILURE_RETAINED"),
      guard = Error("UNIT-replaced-consumer");
    const h = runtimeHarness({
      childError: primary,
      failBoundary: 1,
      guardError: guard,
    });
    combined(h.run, primary, guard);
    assert.deepEqual(h.events, ["execute", "boundary-1"]);
  });
  for (const error of [
    Error("UNIT-unknown-execute-or-guard-error"),
    new AggregateError(
      [Error("UNIT-child"), Error("UNIT-guard")],
      "E_CHILD_AND_STORAGE_FAILURE_NO_LOG_WRITE",
    ),
  ])
    test("UNIT unclassified execute failure never resumes even if later guards would pass", () => {
      const h = runtimeHarness({ childError: error });
      assert.throws(h.run, (e) => e === error);
      assert.deepEqual(h.events, ["execute"]);
    });
  for (const field of ["treeError", "recordError"])
    test(`UNIT report failure + ${field} retains original and secondary errors`, () => {
      const primary = Error("UNIT-report"),
        secondary = Error(`UNIT-${field}`),
        h = runtimeHarness({ reportError: primary, [field]: secondary });
      combined(h.run, primary, secondary);
      assert.equal(h.records.length, 0);
    });
  test("UNIT final boundary loss after inventory prevents result write and preserves primary", () => {
    const primary = Error("UNIT-report"),
      guard = Error("UNIT-final-guard"),
      h = runtimeHarness({
        reportError: primary,
        failBoundary: 4,
        guardError: guard,
      });
    combined(h.run, primary, guard);
    assert.ok(
      h.events.includes("inventory") && !h.events.includes("result-write"),
    );
  });
  test("UNIT healthy synthetic tail retains the original smoke-only result shape", () => {
    const h = runtimeHarness();
    assert.deepEqual(h.run(), {
      status: "observed-runtime-smoke-only",
      cases: ["synthetic-unit-observation"],
      completeWP13: false,
    });
    assert.equal(h.records[0].value.status, "observed-runtime-smoke-only");
  });
  function consumerHarness(change = () => {}, options = {}) {
    const root = "/UNIT/consumer",
      events = [],
      identity = { dev: 7, ino: 11, uid: 1000 };
    const binding = {
      layout: "hdd-v1",
      leaseSHA256: "UNIT-lease",
      root,
      identity,
    };
    const prepared = {
      key: "headless-ordinary",
      candidate: "UNIT-candidate",
      profile: "ordinary",
      storage: binding,
    };
    const state = {
      layout: "hdd-v1",
      roots: { consumers: { "headless-ordinary": root } },
      leaseSHA256: "UNIT-lease",
      lease: { namespace: { dev: 7 } },
      consumers: new Map(),
    };
    const marker = {
      protocol: "wp13-current-archives-v1",
      run: "UNIT",
      key: prepared.key,
      storage: binding,
    };
    change({ prepared, marker, state });
    let physicalCalls = 0;
    const env = {
      ctx: { runId: "UNIT", request: { candidate: "UNIT-candidate" } },
      root,
      supplied: options.supplied,
      context() {
        return state;
      },
      families: ["headless"],
      demand(v, message) {
        if (!v) throw Error(message);
      },
      object(v) {
        assert.ok(v && typeof v === "object");
        return v;
      },
      receipt() {
        events.push("receipt");
        return prepared;
      },
      physical() {
        events.push("physical");
        if (++physicalCalls === (options.failPhysical ?? 0))
          throw options.error;
      },
      capture() {
        events.push("marker");
        if (options.markerError) throw options.markerError;
        return { bytes: Buffer.from(JSON.stringify(marker)) };
      },
      equal(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
      },
      freeze(v) {
        return Object.freeze(v);
      },
    };
    const evaluate = new Function(
      "env",
      `const {ctx,root,supplied,context,families,demand,object,receipt,physical,capture,equal,freeze}=env;return function isolatedConsumerBinding(){${consumerBody}};`,
    );
    return { run: evaluate(env), events, state, root };
  }
  test("UNIT newly issued/unpinned consumer fails physical identity before any marker capture", () => {
    const error = Error("UNIT-replaced-identity"),
      sentinel = Error("UNIT-UNTRUSTED-MARKER-READ");
    const h = consumerHarness(undefined, {
      failPhysical: 1,
      error,
      markerError: sentinel,
    });
    assert.throws(h.run, (e) => e === error);
    assert.deepEqual(h.events, ["receipt", "physical"]);
    assert.equal(h.state.consumers.size, 0);
  });
  for (const field of ["key", "candidate", "profile"])
    test(`UNIT wrong prepared ${field} rejects before consumer marker`, () => {
      const h = consumerHarness(({ prepared }) => {
        prepared[field] = "UNIT-other";
      });
      assert.throws(h.run);
      assert.ok(!h.events.includes("marker"));
      assert.equal(h.state.consumers.size, 0);
    });
  for (const field of ["layout", "leaseSHA256", "root"])
    test(`UNIT wrong storage ${field} rejects before consumer marker`, () => {
      const h = consumerHarness(({ prepared }) => {
        prepared.storage[field] = "UNIT-other";
      });
      assert.throws(h.run);
      assert.ok(!h.events.includes("marker"));
    });
  test("UNIT mismatch with previously pinned identity rejects before marker", () => {
    const h = consumerHarness(({ state }) => {
      state.consumers.set("/UNIT/consumer", { dev: 7, ino: 12, uid: 1000 });
    });
    assert.throws(h.run);
    assert.ok(!h.events.includes("marker"));
  });
  test("UNIT invalid marker never pins identity", () => {
    const h = consumerHarness(({ marker }) => {
      marker.protocol = "UNIT-wrong-protocol";
    });
    assert.throws(h.run);
    assert.equal(h.state.consumers.size, 0);
  });
  test("UNIT physical loss after marker capture still cannot pin identity", () => {
    const error = Error("UNIT-post-marker-loss"),
      h = consumerHarness(undefined, { failPhysical: 2, error });
    assert.throws(h.run, (e) => e === error);
    assert.equal(h.state.consumers.size, 0);
  });
  test("UNIT fully validated synthetic binding pins only after both physical checks", () => {
    const h = consumerHarness();
    h.run();
    assert.deepEqual(h.events, ["receipt", "physical", "marker", "physical"]);
    assert.equal(h.state.consumers.size, 1);
  });
}

export async function registerFilesystem(runId) {
  finalGate();
  const { test } = await import("node:test");
  const boundary = await import("../wp13/lib/boundary.mjs");
  const storage = await import("../wp13/lib/storage-roots.mjs");
  const { regular } = await import("../wp13/lib/receipts.mjs");
  boundary.safeId(runId);
  const roots = storage.storageRoots(runId, "hdd-v1");
  const selection = JSON.parse(
    regular(roots.namespace, "correction-guard-selection.json"),
  );
  assert.deepEqual(selection, {
    status: "main-selected-correction-rejection-fixture",
    run: runId,
    scenario: "new-context-replaced-consumer-before-marker",
  });
  test("FS UNRUN rejection-only new context never captures marker from replaced consumer", (t) => {
    // Main precreates this NEW namespace, roles and tiny synthetic rejection-only
    // controls; approved prepared identity points to the preserved original inode,
    // while the actual consumer has already been replaced. No fixture setup here.
    const ctx = boundary.load(
      runId,
      "prepare",
      "headless",
      "ordinary",
      true,
      "hdd-v1",
    );
    const root = boundary.consumerPath(ctx),
      original = fs.lstatSync;
    let markerMetadataReads = 0;
    t.mock.method(fs, "lstatSync", (file, ...args) => {
      if (file === path.join(root, "wp13-owner.json")) {
        markerMetadataReads += 1;
        throw Error("UNIT-UNTRUSTED-MARKER-METADATA");
      }
      return original(file, ...args);
    });
    assert.throws(
      () => boundary.ownedConsumer(ctx),
      /E_STORAGE_PHYSICAL_REPLACEMENT/,
    );
    assert.equal(markerMetadataReads, 0);
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.length === 3 && process.argv[2] === "--unit")
    await registerUnits();
  else if (process.argv.length === 4 && process.argv[2] === "--run")
    await registerFilesystem(process.argv[3]);
  else
    throw Error("Explicit independently selected --unit or --run ID required");
}
