import { CLOCK, GENERATOR, SEED, digest, type Oracle } from "./fixture.js";
import type { Kind } from "./scenarios.js";
export const SCHEDULER = "committed-dom-double-raf-message-task-v1";
export interface SampleContext {
  readonly run: string;
  readonly session: string;
  readonly scenario: string;
  readonly phase: "warmup" | "measured" | "validation";
  readonly ordinal: number;
  readonly sessionIndex: 0 | 1 | 2;
  readonly candidate: string;
  readonly runner: string;
  readonly protocol: string;
}
export interface Sample extends SampleContext {
  readonly kind: Kind;
  readonly id: string;
  readonly action: number;
  readonly commit: number | null;
  readonly witness: number;
  readonly endpoint: number;
  readonly timeOrigin: number;
  readonly revision: number;
  readonly query: string;
  readonly oracle: string;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly inputCount: number;
  readonly page: number;
  readonly cells: string;
  readonly expectedCells: string;
  readonly ids: readonly string[];
  readonly expectedIds: readonly string[];
  readonly headers: readonly string[];
  readonly expectedHeaders: readonly string[];
  readonly previousRevision: number | null;
  readonly previousQuery: string | null;
  readonly expectedQuery: string;
  readonly firstKey: number | null;
  readonly lastKey: number | null;
  readonly seed: number;
  readonly generator: string;
  readonly semanticClock: number;
  readonly scheduler: string;
  readonly binding: Binding | null;
  readonly total: number | null;
  readonly hasNextPage: boolean | null;
  readonly exclusions: {
    readonly network: null;
    readonly backend: null;
    readonly startup: null;
    readonly ssr: null;
    readonly customRenderer: null;
    readonly reason: string;
    readonly debounceMs: 300 | null;
  };
}
export interface Binding {
  readonly definition: string;
  readonly scope: string;
  readonly query: string;
  readonly generation: number;
  readonly request: string;
  readonly evaluatedAt: number | undefined;
  readonly page: number;
  readonly size: number;
}
interface Pending {
  readonly context: SampleContext;
  readonly kind: Kind;
  readonly action: number;
  readonly oracle: Oracle;
  readonly expectedQuery: string;
  readonly previousRevision: number | null;
  readonly previousQuery: string | null;
  commit: number | null;
  revision: number | null;
  firstKey: number | null;
  lastKey: number | null;
  resolving: boolean;
}
export function createTiming() {
  let pending: Pending | null = null,
    result: Sample | null = null,
    failure: string | null = null;
  let resetTarget: {
      readonly oracle: Oracle;
      readonly expectedQuery: string;
    } | null = null,
    ready = false;
  function arm(
    context: SampleContext,
    kind: Kind,
    oracle: Oracle,
    expectedQuery: string,
    before: { revision: number; queryIdentity: string } | null,
  ) {
    if (pending) throw new Error("E_SAMPLE_OVERLAP");
    result = null;
    failure = null;
    resetTarget = null;
    ready = false;
    pending = {
      context,
      kind,
      oracle,
      expectedQuery,
      action: performance.now(),
      previousRevision: before?.revision ?? null,
      previousQuery: before?.queryIdentity ?? null,
      commit: null,
      revision: null,
      firstKey: null,
      lastKey: null,
      resolving: false,
    };
    performance.mark(
      `wp14:${context.session}:${context.scenario}:${context.phase}:${context.ordinal}:action`,
    );
  }
  return {
    arm,
    reset(oracle: Oracle, expectedQuery: string) {
      if (pending) throw new Error("E_SAMPLE_OVERLAP");
      resetTarget = { oracle, expectedQuery };
      ready = false;
      result = null;
      failure = null;
    },
    get target() {
      return pending ?? resetTarget;
    },
    get ready() {
      return ready;
    },
    resetMatched(
      state: { queryIdentity: string },
      dom: {
        ids: readonly string[];
        headers: readonly string[];
        cells: string;
      },
    ) {
      const p = resetTarget;
      if (
        p &&
        state.queryIdentity === p.expectedQuery &&
        JSON.stringify(dom.ids) === JSON.stringify(p.oracle.ids) &&
        JSON.stringify(dom.headers) === JSON.stringify(p.oracle.headers) &&
        dom.cells === p.oracle.cells
      )
        ready = true;
    },
    observe(state: {
      readonly revision: number;
      readonly queryIdentity: string;
    }) {
      const p = pending;
      if (!p || p.kind === "initial") return;
      if (p.commit !== null || state.revision === p.previousRevision) {
        failure = "E_MULTIPLE_OR_NOOP_COMMIT";
        return;
      }
      p.commit = performance.now();
      p.revision = state.revision;
      if (
        p.expectedQuery !== state.queryIdentity ||
        (p.kind !== "visibility" && p.previousQuery === state.queryIdentity)
      )
        failure = "E_COMMIT_IDENTITY";
      performance.mark(
        `wp14:${p.context.session}:${p.context.scenario}:${p.context.phase}:${p.context.ordinal}:commit`,
      );
    },
    key() {
      if (pending?.kind === "typing") {
        const now = performance.now();
        pending.firstKey ??= now;
        pending.lastKey = now;
      }
    },
    get pending() {
      return pending;
    },
    fail(code: string) {
      failure ??= code;
    },
    read() {
      if (failure) throw new Error(failure);
      return result;
    },
    async complete(
      state: { revision: number; queryIdentity: string },
      dom: {
        ids: readonly string[];
        headers: readonly string[];
        cells: string;
        binding: Binding | null;
        inputCount: number;
        page: number;
        total: number | null;
        hasNextPage: boolean | null;
      },
      assertCurrent: () => void,
    ) {
      const p = pending;
      if (!p || p.resolving || (p.kind !== "initial" && p.commit === null))
        return;
      if (
        p.expectedQuery !== state.queryIdentity ||
        (p.revision !== null && p.revision !== state.revision)
      ) {
        failure = "E_WITNESS_IDENTITY";
        return;
      }
      if (
        JSON.stringify(dom.ids) !== JSON.stringify(p.oracle.ids) ||
        JSON.stringify(dom.headers) !== JSON.stringify(p.oracle.headers) ||
        dom.cells !== p.oracle.cells
      )
        return;
      p.resolving = true;
      const witness = performance.now();
      const prefix = `wp14:${p.context.session}:${p.context.scenario}:${p.context.phase}:${p.context.ordinal}`;
      performance.mark(`${prefix}:witness`);
      try {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const channel = new MessageChannel();
              channel.port1.onmessage = () => {
                channel.port1.close();
                channel.port2.close();
                resolve();
              };
              channel.port2.postMessage(null);
            }),
          ),
        );
        assertCurrent();
        if (pending !== p || failure) throw new Error("E_ENDED_SAMPLE");
        const endpoint = performance.now();
        performance.mark(`${prefix}:endpoint`);
        result = Object.freeze({
          ...p.context,
          kind: p.kind,
          id: `${p.context.session}:${p.context.scenario}:${p.context.phase}:${p.context.ordinal}`,
          action: p.action,
          commit: p.commit,
          witness,
          endpoint,
          timeOrigin: performance.timeOrigin,
          revision: state.revision,
          query: digest(state.queryIdentity),
          expectedQuery: digest(p.expectedQuery),
          previousRevision: p.previousRevision,
          previousQuery:
            p.previousQuery === null ? null : digest(p.previousQuery),
          oracle: p.oracle.digest,
          rowCount: dom.ids.length,
          columnCount: dom.headers.length,
          inputCount: dom.inputCount,
          page: dom.page,
          cells: dom.cells,
          expectedCells: p.oracle.cells,
          ids: dom.ids,
          expectedIds: p.oracle.ids,
          headers: dom.headers,
          expectedHeaders: p.oracle.headers,
          firstKey: p.firstKey,
          lastKey: p.lastKey,
          seed: SEED,
          generator: GENERATOR,
          semanticClock: CLOCK,
          scheduler: SCHEDULER,
          binding: dom.binding,
          total: dom.total,
          hasNextPage: dom.hasNextPage,
          exclusions: {
            network: null,
            backend: null,
            startup: null,
            ssr: null,
            customRenderer: null,
            reason:
              "already-available synthetic data; route/network/backend/SSR not measured; charts/editors excluded upfront",
            debounceMs: p.kind === "typing" ? (300 as const) : null,
          },
        });
        pending = null;
      } catch {
        failure = "E_AFTER_COMMIT_WITNESS";
        pending = null;
      }
    },
  };
}
export type Timing = ReturnType<typeof createTiming>;
