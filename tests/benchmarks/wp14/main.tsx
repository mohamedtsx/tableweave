import { createRoot } from "react-dom/client";
import {
  getQueryIdentity,
  type QuerySchema,
} from "@tableweave/react/contracts";
import type { TableDefinition } from "@tableweave/react";
import { Benchmark } from "./Benchmark.js";
import { clientDefinition, serverDefinition } from "./definition.js";
import {
  CLOCK,
  clientRows,
  digest,
  oracle,
  row,
  type BenchClient,
  type Oracle,
  type Plan,
} from "./fixture.js";
import { plans, SCENARIOS, AUXILIARY, type Scenario } from "./scenarios.js";
import { clientSchema, serverSchema } from "./schema.js";
import { createSource, type Prepared } from "./source.js";
import { query } from "./schema.js";
import { createTiming, type Sample, type SampleContext } from "./timing.js";
import "./styles.css";
const container = document.getElementById("root");
if (!container) throw new Error("E_ROOT");
const reactRoot = createRoot(container);
let clientInput: readonly BenchClient[] | null = null;
const compactOracles = new Map<string, Oracle>();
interface Active {
  prepare(direction: 0 | 1): void;
  ready(): boolean;
  run(context: SampleContext, direction: 0 | 1): void;
  result(): Sample | null;
  close(): boolean;
}
let active: Active | null = null;
function prepare<S extends QuerySchema>(
  schema: S,
  plan: Plan,
  server: boolean,
) {
  const key = JSON.stringify({ plan, server });
  let expected = compactOracles.get(key);
  if (!expected) {
    expected = oracle(plan, server);
    compactOracles.set(key, expected);
  }
  return { query: query(schema, plan), plan, oracle: expected };
}
function mount<S extends QuerySchema, T extends BenchClient>(
  define: () => TableDefinition<S, T>,
  schema: S,
  input: readonly T[],
  initial: Prepared<S, T>,
  scenario: Scenario,
  context: SampleContext,
  prepareNext: (plan: Plan) => Prepared<S, T>,
): Active {
  const timing = createTiming();
  if (scenario.kind === "initial")
    timing.arm(
      context,
      "initial",
      initial.oracle,
      getQueryIdentity(schema, initial.query, { now: CLOCK }),
      null,
    );
  else
    timing.reset(
      initial.oracle,
      getQueryIdentity(schema, initial.query, { now: CLOCK }),
    );
  const D = define();
  // Initial start above precedes the genuine C/P/source constructor and React mount.
  const source = createSource(
    D,
    scenario.mode,
    input,
    initial,
    timing,
    `${context.run}:${context.session}:${scenario.id}`,
  );
  reactRoot.render(
    <Benchmark
      key={`${context.session}:${scenario.id}:${context.phase}:${context.ordinal}`}
      source={source}
    />,
  );
  return {
    prepare(direction) {
      if (scenario.kind === "initial")
        throw new Error("E_INITIAL_REQUIRES_NEW_OWNER");
      const before = prepareNext(plans(scenario.kind, direction).before);
      timing.reset(
        before.oracle,
        getQueryIdentity(D.native.controllerDefinition.schema, before.query, {
          now: CLOCK,
        }),
      );
      source.set(before);
      source.set(before, true);
    },
    ready: () => timing.ready,
    run(nextContext, direction) {
      if (scenario.kind === "initial")
        throw new Error("E_INITIAL_REQUIRES_NEW_OWNER");
      if (!timing.ready) throw new Error("E_RESET_DOM_NOT_MATCHED");
      const after = prepareNext(plans(scenario.kind, direction).after);
      if (timing.pending) throw new Error("E_PREVIOUS_SAMPLE_PENDING");
      const state = source.C.getSnapshot(),
        identity = getQueryIdentity(
          D.native.controllerDefinition.schema,
          after.query,
          { now: CLOCK },
        );
      timing.arm(nextContext, scenario.kind, after.oracle, identity, state);
      if (scenario.kind === "typing") source.prepareTyping(after);
      else if (
        source.set(after, scenario.kind === "visibility").status !== "committed"
      )
        throw new Error("E_TIMED_NOOP");
    },
    result: () => timing.read(),
    close() {
      if (!source.retire()) return false;
      reactRoot.render(null);
      return true;
    },
  };
}
export interface Harness {
  oracles(): Readonly<
    Record<
      string,
      {
        readonly digest: string;
        readonly query: string;
        readonly cells: string;
        readonly ids: readonly string[];
        readonly headers: readonly string[];
        readonly page: number;
        readonly total: number;
        readonly hasNextPage: boolean;
      }
    >
  >;
  start(scenario: Scenario, context: SampleContext, direction: 0 | 1): void;
  prepare(direction: 0 | 1): void;
  ready(): boolean;
  run(context: SampleContext, direction: 0 | 1): void;
  read(): Sample | null;
  end(): void;
}
const harness: Harness = {
  oracles() {
    const result: Record<
      string,
      {
        digest: string;
        query: string;
        cells: string;
        ids: readonly string[];
        headers: readonly string[];
        page: number;
        total: number;
        hasNextPage: boolean;
      }
    > = {};
    for (const scenario of [...SCENARIOS, ...AUXILIARY])
      for (const phase of ["warmup", "measured"] as const)
        for (const direction of [0, 1] as const) {
          const plan = plans(scenario.kind, direction).after,
            schema = scenario.mode === "client" ? clientSchema : serverSchema;
          const prepared = prepare(schema, plan, scenario.mode !== "client");
          result[`${scenario.id}:${phase}:${direction}`] = {
            digest: prepared.oracle.digest,
            query: digest(
              getQueryIdentity(schema, prepared.query, { now: CLOCK }),
            ),
            cells: prepared.oracle.cells,
            ids: prepared.oracle.ids,
            headers: prepared.oracle.headers,
            page: prepared.oracle.page,
            total: prepared.oracle.total,
            hasNextPage: prepared.oracle.hasNextPage,
          };
        }
    return result;
  },
  start(scenario, context, direction) {
    if (active && !active.close()) throw new Error("E_SOURCE_CLEANUP_DEBT");
    active = null;
    const initialPlan = plans(scenario.kind, direction).before;
    if (scenario.mode === "client") {
      clientInput ??= clientRows();
      if (clientInput.length !== 10_000)
        throw new Error("E_CLIENT_INPUT_COUNT");
      const next = (plan: Plan) => ({
        ...prepare(clientSchema, plan, false),
        reply: [],
      });
      active = mount(
        clientDefinition,
        clientSchema,
        clientInput,
        next(initialPlan),
        scenario,
        context,
        next,
      );
    } else {
      const next = (plan: Plan) => {
        const value = prepare(serverSchema, plan, true);
        return {
          ...value,
          reply: value.oracle.ids.map((id) => {
            if (!/^wp14-\d{6}$/.test(id)) throw new Error("E_ORACLE_ID");
            return row(Number(id.slice(5)));
          }),
        };
      };
      active = mount(
        serverDefinition,
        serverSchema,
        [],
        next(initialPlan),
        scenario,
        context,
        next,
      );
    }
  },
  prepare(direction) {
    if (!active) throw new Error("E_NO_OWNER");
    active.prepare(direction);
  },
  ready: () => active?.ready() ?? false,
  run(context, direction) {
    if (!active) throw new Error("E_NO_OWNER");
    active.run(context, direction);
  },
  read: () => active?.result() ?? null,
  end() {
    if (active && !active.close()) throw new Error("E_SOURCE_CLEANUP_DEBT");
    active = null;
  },
};
declare global {
  interface Window {
    wp14: Harness;
  }
}
window.wp14 = harness;
