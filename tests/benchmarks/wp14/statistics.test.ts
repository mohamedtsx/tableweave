// FINAL UNRUN: labeled numeric unit vectors, NEVER observed timings/authority.
import assert from "node:assert/strict";
import { it } from "node:test";
import {
  analyze,
  nearest,
  scenarioIds,
  validateSample,
} from "./statistics.mjs";
import type { Sample } from "./timing.js";
function synthetic() {
  const run = "unit-synthetic-never-observed",
    candidate = "a".repeat(64),
    runner = "b".repeat(64),
    protocol = "c".repeat(64),
    scheduler = "committed-dom-double-raf-message-task-v1";
  const ids = Array.from(
    { length: 100 },
    (_, index) => `wp14-${String(index).padStart(6, "0")}`,
  );
  const sessions = [0, 1, 2].map((index) => ({
    id: `measurement-${index}`,
    pid: 100 + index,
    timeOrigin: 1_000_000 + index,
    observation: runner,
    scopes: Object.fromEntries(
      scenarioIds.map((id: string) => [id, "abcd1234"]),
    ),
  }));
  const oracles: Record<
    string,
    {
      digest: string;
      query: string;
      cells: string;
      ids: string[];
      headers: string[];
      page: number;
      total: number;
      hasNextPage: boolean;
    }
  > = {};
  const samples: Sample[] = [];
  for (const [index, session] of sessions.entries()) {
    let cursor = 1;
    for (const scenario of scenarioIds) {
      const server = scenario.startsWith("server-"),
        kind = scenario.split(":")[1];
      if (
        typeof kind !== "string" ||
        ![
          "initial",
          "all",
          "any",
          "join",
          "sort",
          "page",
          "visibility",
          "typing",
        ].includes(kind)
      )
        throw new Error("E_UNIT_KIND");
      for (const phase of ["warmup", "measured"] as const)
        for (
          let ordinal = 0;
          ordinal < (phase === "warmup" ? 10 : index === 0 ? 34 : 33);
          ordinal++
        ) {
          const headers = [
              "reference",
              ...Array.from(
                { length: (server ? 30 : 20) - 1 },
                (_, item) => `field${item}`,
              ),
            ],
            key = `${scenario}:${phase}:${ordinal % 2}`;
          oracles[key] = {
            digest: "1234abcd",
            query: "11223344",
            cells: "aabbccdd",
            ids,
            headers,
            page: 0,
            total: 1000,
            hasNextPage: true,
          };
          const typedKind =
            kind === "initial"
              ? "initial"
              : kind === "all"
                ? "all"
                : kind === "any"
                  ? "any"
                  : kind === "join"
                    ? "join"
                    : kind === "sort"
                      ? "sort"
                      : kind === "page"
                        ? "page"
                        : kind === "visibility"
                          ? "visibility"
                          : "typing";
          const value: Sample = {
            run,
            candidate,
            runner,
            protocol,
            scheduler,
            session: session.id,
            sessionIndex: index === 0 ? 0 : index === 1 ? 1 : 2,
            scenario,
            phase,
            ordinal,
            kind: typedKind,
            id: `${session.id}:${scenario}:${phase}:${ordinal}`,
            action: cursor,
            commit:
              kind === "initial"
                ? null
                : kind === "typing"
                  ? cursor + 302
                  : cursor + 1,
            witness: cursor + 310,
            endpoint: cursor + 320,
            timeOrigin: session.timeOrigin,
            revision: 1,
            previousRevision: kind === "initial" ? null : 0,
            query: "11223344",
            expectedQuery: "11223344",
            previousQuery:
              kind === "initial"
                ? null
                : kind === "visibility"
                  ? "11223344"
                  : "44332211",
            oracle: "1234abcd",
            rowCount: 100,
            columnCount: headers.length,
            inputCount: server ? 100 : 10000,
            page: 0,
            cells: "aabbccdd",
            expectedCells: "aabbccdd",
            ids,
            expectedIds: ids,
            headers,
            expectedHeaders: headers,
            firstKey: kind === "typing" ? cursor + 1 : null,
            lastKey: kind === "typing" ? cursor + 2 : null,
            seed: 0x57503134,
            generator: "xorshift32-row-v1",
            semanticClock: 1795608000000,
            binding: server
              ? {
                  definition: "wp14-server-reference",
                  scope: "abcd1234",
                  query: "11223344",
                  generation: 1,
                  request: "wp14-read-1",
                  evaluatedAt: 1795608000000,
                  page: 0,
                  size: 100,
                }
              : null,
            total: scenario.startsWith("server-unknown") ? null : 1000,
            hasNextPage: scenario.startsWith("server-unknown") ? true : null,
            exclusions: {
              network: null,
              backend: null,
              startup: null,
              ssr: null,
              customRenderer: null,
              reason: "UNIT SYNTHETIC NUMERIC VECTOR NOT MEASURED",
              debounceMs: kind === "typing" ? 300 : null,
            },
          };
          samples.push(value);
          cursor += 500;
        }
    }
  }
  return {
    samples,
    expected: {
      run,
      candidate,
      runner,
      protocol,
      scheduler,
      sessions,
      oracles,
    },
  };
}
it("nearest-rank uses95th/100, not averaged percentiles", () => {
  assert.equal(
    nearest(
      Array.from({ length: 100 }, (_, index) => index + 1),
      0.95,
    ),
    95,
  );
  assert.throws(() => nearest([], 0.95));
  assert.throws(() => nearest([Number.NaN], 0.5));
});
it("valid100 total per scenario across three sessions parses; slow query p95 remains FAIL", () => {
  const value = synthetic();
  assert.equal(
    analyze(value.samples, value.expected).status,
    "FAIL_REFERENCE_BUDGETS",
  );
  assert.equal(
    Object.keys(analyze(value.samples, value.expected).scenarios).length,
    24,
  );
});
it("complete synthetic unit input below thresholds exercises numeric success, never a performance observation", () => {
  const value = synthetic();
  const samples = value.samples.map((sample) =>
    sample.kind === "typing"
      ? sample
      : {
          ...sample,
          witness: sample.action + 100,
          endpoint: sample.action + 150,
        },
  );
  assert.deepEqual(analyze(samples, value.expected).failures, []);
});
it("rejects empty/truncated/duplicate/missing session and distribution", () => {
  const value = synthetic();
  assert.throws(() => analyze([], value.expected));
  assert.throws(() => analyze(value.samples.slice(1), value.expected));
  const duplicate = [...value.samples];
  const first = duplicate[0];
  if (!first) throw new Error("E_UNIT_SAMPLE");
  duplicate[1] = first;
  assert.throws(() => analyze(duplicate, value.expected));
  assert.throws(() =>
    analyze(value.samples, {
      ...value.expected,
      sessions: value.expected.sessions.slice(1),
    }),
  );
});
it("rejects nonfinite/negative/out-of-order/wrong-query/row/input/binding/environment/clock/oracle vectors", () => {
  const value = synthetic(),
    sample = value.samples.find(
      (sample) =>
        sample.scenario === "server-known:all" && sample.phase === "measured",
    );
  if (!sample) throw new Error("E_UNIT_SAMPLE");
  const mutations: readonly Partial<Sample>[] = [
    { endpoint: Number.NaN },
    { action: -1 },
    { witness: sample.action - 1 },
    { commit: sample.witness + 1 },
    { query: "ffffffff" },
    { rowCount: 0 },
    { rowCount: 99 },
    { inputCount: 10 },
    { binding: null },
    { candidate: "different" },
    { runner: "f".repeat(64) },
    { protocol: "f".repeat(64) },
    { session: "missing" },
    { previousQuery: sample.query },
    { previousRevision: sample.revision },
    { timeOrigin: -1 },
    { oracle: "ffffffff" },
    { cells: "ffffffff" },
    { ids: Array.from({ length: 100 }, () => "wp14-000000") },
    { headers: [] },
    { total: null },
    { phase: "validation" },
  ];
  for (const change of mutations)
    assert.throws(() =>
      validateSample({ ...sample, ...change }, value.expected),
    );
});
it("no sample overlap/reordering, warmups never become observations", () => {
  const value = synthetic();
  const reordered = [...value.samples].reverse();
  assert.throws(() => analyze(reordered, value.expected));
  const sample = value.samples[0];
  if (!sample) throw new Error("E_UNIT_SAMPLE");
  assert.throws(() =>
    validateSample(
      { ...sample, phase: "measured", ordinal: 34 },
      value.expected,
    ),
  );
});
