/** Pure FINAL-only statistics. MJS unchecked by source LIGHT; never auto-runs. */
const modes = ["client", "server-known", "server-unknown"];
const kinds = [
  "initial",
  "all",
  "any",
  "join",
  "sort",
  "page",
  "visibility",
  "typing",
];
export const scenarioIds = modes.flatMap((mode) =>
  kinds.map((kind) => `${mode}:${kind}`),
);
export function requireValue(value, code) {
  if (!value) throw new Error(code);
}
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function nearest(values, percentile) {
  requireValue(
    values.length > 0 &&
      values.every((value) => finite(value) && value >= 0) &&
      finite(percentile) &&
      percentile > 0 &&
      percentile <= 1,
    "E_PERCENTILE_INPUT",
  );
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * percentile) - 1];
}
function stats(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    n: values.length,
    p50: nearest(values, 0.5),
    p95: nearest(values, 0.95),
    max: Math.max(...values),
    variance:
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      values.length,
  };
}
export function validateSample(value, expected) {
  requireValue(
    value && typeof value === "object" && !Array.isArray(value),
    "E_SAMPLE_OBJECT",
  );
  const fields = [
    "run",
    "session",
    "scenario",
    "phase",
    "ordinal",
    "sessionIndex",
    "candidate",
    "runner",
    "protocol",
    "kind",
    "id",
    "action",
    "commit",
    "witness",
    "endpoint",
    "timeOrigin",
    "revision",
    "query",
    "oracle",
    "rowCount",
    "columnCount",
    "inputCount",
    "page",
    "cells",
    "expectedCells",
    "ids",
    "expectedIds",
    "headers",
    "expectedHeaders",
    "previousRevision",
    "previousQuery",
    "expectedQuery",
    "firstKey",
    "lastKey",
    "seed",
    "generator",
    "semanticClock",
    "scheduler",
    "binding",
    "total",
    "hasNextPage",
    "exclusions",
  ];
  requireValue(
    Object.keys(value).length === fields.length &&
      fields.every((key) => Object.hasOwn(value, key)),
    "E_SAMPLE_FIELDS",
  );
  for (const field of ["run", "candidate", "runner", "protocol", "scheduler"])
    requireValue(value[field] === expected[field], "E_SAMPLE_INPUT_MISMATCH");
  for (const field of ["candidate", "runner", "protocol"])
    requireValue(
      typeof value[field] === "string" && /^[a-f0-9]{64}$/.test(value[field]),
      "E_INPUT_DIGEST",
    );
  requireValue(
    scenarioIds.includes(value.scenario) &&
      value.kind === value.scenario.split(":")[1],
    "E_SCENARIO",
  );
  requireValue(
    Number.isSafeInteger(value.sessionIndex) &&
      value.sessionIndex >= 0 &&
      value.sessionIndex <= 2 &&
      value.session === expected.sessions[value.sessionIndex]?.id,
    "E_SESSION",
  );
  requireValue(
    ["warmup", "measured"].includes(value.phase) &&
      Number.isSafeInteger(value.ordinal) &&
      value.ordinal >= 0 &&
      value.ordinal <
        (value.phase === "warmup" ? 10 : [34, 33, 33][value.sessionIndex]),
    "E_SAMPLE_DISTRIBUTION",
  );
  requireValue(
    value.id ===
      `${value.session}:${value.scenario}:${value.phase}:${value.ordinal}`,
    "E_SAMPLE_ID",
  );
  requireValue(
    finite(value.timeOrigin) &&
      value.timeOrigin > 0 &&
      value.timeOrigin === expected.sessions[value.sessionIndex].timeOrigin,
    "E_CLOCK_ORIGIN",
  );
  requireValue(
    [value.action, value.witness, value.endpoint].every(finite) &&
      value.action >= 0 &&
      value.witness > value.action &&
      value.endpoint > value.witness,
    "E_MARK_ORDER",
  );
  requireValue(
    Number.isSafeInteger(value.revision) &&
      value.revision >= 0 &&
      /^[a-f0-9]{8}$/.test(value.query) &&
      value.query === value.expectedQuery &&
      /^[a-f0-9]{8}$/.test(value.oracle),
    "E_ACCEPTED_IDENTITY",
  );
  if (value.kind === "initial")
    requireValue(
      value.commit === null &&
        value.previousRevision === null &&
        value.previousQuery === null,
      "E_INITIAL_BOUNDARY",
    );
  else {
    requireValue(
      finite(value.commit) &&
        value.commit >= value.action &&
        value.commit < value.witness &&
        Number.isSafeInteger(value.previousRevision) &&
        value.revision > value.previousRevision,
      "E_COMMIT_BOUNDARY",
    );
    if (value.kind !== "visibility")
      requireValue(value.query !== value.previousQuery, "E_QUERY_NOOP");
    else
      requireValue(
        value.query === value.previousQuery,
        "E_CONTROL_QUERY_CHANGED",
      );
  }
  const server = value.scenario.startsWith("server-");
  if (server) {
    const b = value.binding;
    requireValue(
      b &&
        Object.keys(b).length === 8 &&
        b.definition === "wp14-server-reference" &&
        b.query === value.query &&
        b.scope ===
          expected.sessions[value.sessionIndex].scopes[value.scenario] &&
        Number.isSafeInteger(b.generation) &&
        b.generation >= 0 &&
        /^wp14-read-\d+$/.test(b.request) &&
        b.evaluatedAt === value.semanticClock &&
        b.page === value.page &&
        b.size === 100,
      "E_RESOURCE_BINDING",
    );
  } else requireValue(value.binding === null, "E_CLIENT_BINDING");
  requireValue(
    value.rowCount === 100 &&
      value.inputCount === (server ? 100 : 10000) &&
      [0, 1].includes(value.page),
    "E_ROW_INPUT_EXTENT",
  );
  requireValue(
    value.columnCount ===
      (server ? 30 : 20) - (value.headers.includes("reference") ? 0 : 1) &&
      (value.kind === "visibility" || value.headers.includes("reference")),
    "E_COLUMN_COUNT",
  );
  requireValue(
    Array.isArray(value.ids) &&
      value.ids.length === 100 &&
      new Set(value.ids).size === 100 &&
      value.ids.every(
        (id) => typeof id === "string" && /^wp14-\d{6}$/.test(id),
      ) &&
      same(value.ids, value.expectedIds),
    "E_ROW_ORACLE",
  );
  requireValue(
    Array.isArray(value.headers) &&
      value.headers.length === value.columnCount &&
      new Set(value.headers).size === value.columnCount &&
      same(value.headers, value.expectedHeaders) &&
      value.cells === value.expectedCells &&
      /^[a-f0-9]{8}$/.test(value.cells),
    "E_CELL_HEADER_ORACLE",
  );
  requireValue(
    value.seed === 0x57503134 &&
      value.generator === "xorshift32-row-v1" &&
      value.semanticClock === 1795608000000,
    "E_FIXTURE_PROTOCOL",
  );
  const exclusions = value.exclusions;
  requireValue(
    exclusions &&
      Object.keys(exclusions).length === 7 &&
      ["network", "backend", "startup", "ssr", "customRenderer"].every(
        (key) => exclusions[key] === null,
      ) &&
      typeof exclusions.reason === "string" &&
      exclusions.reason.length > 0,
    "E_EXCLUSION_FIELDS",
  );
  if (value.kind === "typing")
    requireValue(
      exclusions.debounceMs === 300 &&
        finite(value.firstKey) &&
        finite(value.lastKey) &&
        value.firstKey >= value.action &&
        value.lastKey >= value.firstKey &&
        value.commit - value.lastKey >= 300,
      "E_TYPING_DEBOUNCE",
    );
  else
    requireValue(
      value.firstKey === null &&
        value.lastKey === null &&
        exclusions.debounceMs === null,
      "E_UNEXPECTED_TYPING",
    );
  const oracle =
    expected.oracles[`${value.scenario}:${value.phase}:${value.ordinal % 2}`];
  requireValue(
    oracle &&
      value.oracle === oracle.digest &&
      value.query === oracle.query &&
      value.cells === oracle.cells &&
      same(value.ids, oracle.ids) &&
      same(value.headers, oracle.headers) &&
      value.page === oracle.page,
    "E_PREDECLARED_ORACLE",
  );
  requireValue(
    value.scenario.startsWith("server-unknown:")
      ? value.total === null &&
          typeof value.hasNextPage === "boolean" &&
          value.hasNextPage === oracle.hasNextPage
      : Number.isSafeInteger(value.total) &&
          value.total >= (value.page + 1) * 100 &&
          value.total === oracle.total &&
          value.hasNextPage === null,
    "E_SUPPLIED_TOTALS",
  );
  return value;
}
export function analyze(samples, expected) {
  requireValue(
    Array.isArray(samples) && samples.length === 24 * 130,
    "E_COMPLETE_NONEMPTY_RUN",
  );
  requireValue(
    expected.sessions.length === 3 &&
      new Set(expected.sessions.map((session) => session.id)).size === 3 &&
      new Set(expected.sessions.map((session) => session.pid)).size === 3 &&
      expected.sessions.every(
        (session) =>
          Number.isSafeInteger(session.pid) &&
          session.pid > 0 &&
          session.observation === expected.runner,
      ),
    "E_FRESH_PROCESSES",
  );
  const ordered = expected.sessions.flatMap((session, index) =>
    scenarioIds.flatMap((scenario) =>
      ["warmup", "measured"].flatMap((phase) =>
        Array.from(
          { length: phase === "warmup" ? 10 : [34, 33, 33][index] },
          (_, ordinal) => `${session.id}:${scenario}:${phase}:${ordinal}`,
        ),
      ),
    ),
  );
  requireValue(
    same(
      samples.map((sample) => sample.id),
      ordered,
    ),
    "E_FIXED_SCENARIO_SAMPLE_ORDER",
  );
  const seen = new Set(),
    previous = new Map(),
    phases = new Map();
  for (const raw of samples) {
    const sample = validateSample(raw, expected);
    requireValue(!seen.has(sample.id), "E_DUPLICATE_SAMPLE");
    seen.add(sample.id);
    const old = previous.get(sample.session);
    requireValue(
      !old || sample.action > old.endpoint,
      "E_OVERLAPPING_OR_OUT_OF_ORDER",
    );
    previous.set(sample.session, sample);
    const key = `${sample.session}:${sample.scenario}`,
      phase = phases.get(key);
    requireValue(
      !(phase === "measured" && sample.phase === "warmup"),
      "E_WARMUP_ORDER",
    );
    phases.set(key, sample.phase);
  }
  const result = {},
    failures = [];
  for (const scenario of scenarioIds) {
    const measured = samples.filter(
      (sample) => sample.scenario === scenario && sample.phase === "measured",
    );
    requireValue(measured.length === 100, "E_SCENARIO_100");
    const sessions = expected.sessions.map((session, index) => {
      const warmups = samples.filter(
        (sample) =>
          sample.session === session.id &&
          sample.scenario === scenario &&
          sample.phase === "warmup",
      );
      const selected = measured.filter(
        (sample) => sample.session === session.id,
      );
      requireValue(
        warmups.length === 10 && selected.length === [34, 33, 33][index],
        "E_SESSION_COUNTS",
      );
      return {
        session: session.id,
        warmups: 10,
        actionToPaint: stats(
          selected.map((sample) => sample.endpoint - sample.action),
        ),
        commitToPaint: scenario.endsWith(":initial")
          ? null
          : stats(selected.map((sample) => sample.endpoint - sample.commit)),
      };
    });
    const initial = scenario.endsWith(":initial"),
      typing = scenario.endsWith(":typing"),
      control = scenario.endsWith(":visibility");
    const actionToPaint = stats(
        measured.map((sample) => sample.endpoint - sample.action),
      ),
      commitToPaint = initial
        ? null
        : stats(measured.map((sample) => sample.endpoint - sample.commit));
    const actionToCommit = initial
      ? null
      : stats(measured.map((sample) => sample.commit - sample.action));
    const typingToResult = typing
      ? {
          firstKeyToPaint: stats(
            measured.map((sample) => sample.endpoint - sample.firstKey),
          ),
          lastKeyToPaint: stats(
            measured.map((sample) => sample.endpoint - sample.lastKey),
          ),
          configuredDebounceMs: 300,
        }
      : null;
    if (
      initial
        ? actionToPaint.max > 1000
        : !typing &&
          (actionToPaint.p95 > 200 || (!control && commitToPaint.p95 > 200))
    )
      failures.push(scenario);
    result[scenario] = {
      sessions,
      actionToPaint,
      commitToPaint,
      actionToCommit,
      typingToResult,
      budget: initial
        ? "all initial samples <=1000ms"
        : typing
          ? "auxiliary, no200ms typing budget"
          : control
            ? "action-to-paint p95<=200ms"
            : "action AND observed-commit-to-paint p95<=200ms",
    };
  }
  return {
    status: failures.length
      ? "FAIL_REFERENCE_BUDGETS"
      : "MEASURED_REFERENCE_BUDGETS_MET_NOT_RELEASE_APPROVAL",
    failures,
    scenarios: result,
    reorder: {
      status: "BLOCKED",
      milliseconds: null,
      reason: "user keeps drag blocked; no frame guarantee",
    },
  };
}
