import type { StateProposal } from "@tableweave/react";
import type { ScalarId } from "@tableweave/react/contracts";
import type {
  FilterOption,
  OptionRequest,
  OptionSourceContext,
} from "@tableweave/react/filters";
import { createOptionSource } from "@tableweave/react/filters";
import type { FixtureSchema } from "./data.js";

/** Application-controlled proposal transport, separate from accepted table state. */
export function createProposalPort() {
  let pending: StateProposal<FixtureSchema> | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => pending,
    getServerSnapshot: () => null,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next: StateProposal<FixtureSchema> | null) {
      pending = next;
      for (const listener of listeners) listener();
    },
  };
}

/** Explicit synthetic transport controls. No endpoint, timers or automatic reads. */
export type OptionTransportMode = "manual" | "ready" | "empty" | "fail-once";
export function createOptionDriver<Id extends ScalarId>(
  context: OptionSourceContext,
  options: readonly FilterOption<Id>[],
  initialMode: OptionTransportMode = "manual",
) {
  const source = createOptionSource<Id>(context);
  const empty: readonly OptionRequest[] = Object.freeze([]);
  let pending: readonly OptionRequest[] = empty;
  const listeners = new Set<() => void>();
  const publish = () => {
    for (const listener of listeners) listener();
  };
  let mode = initialMode;
  const settle = (
    token: OptionRequest,
    result: "ready" | "empty" | "failure",
  ) => {
    const matches = options.filter((option) =>
      option.label.toLowerCase().includes(token.term.trim().toLowerCase()),
    );
    const current =
      token.pageKey === "continuation:tail"
        ? matches.slice(2)
        : matches.slice(0, 2);
    const accepted =
      result === "failure"
        ? source.fail(token, "unavailable")
        : source.succeed(token, {
            options: result === "empty" ? [] : current,
            hasMore:
              result !== "empty" &&
              token.pageKey !== "continuation:tail" &&
              matches.length > 2,
          });
    pending = pending.filter((entry) => entry !== token);
    publish();
    return accepted;
  };
  const enqueue = (token: OptionRequest) => {
    if (pending.includes(token)) return;
    // Request handles only, not an option-page cache. Keep enough obsolete handles
    // to deterministically deliver late/ABA responses without an unbounded log.
    pending = [...pending.slice(-7), token];
    publish();
    if (mode === "fail-once") {
      mode = "ready";
      settle(token, "failure");
    } else if (mode === "ready" || mode === "empty") settle(token, mode);
  };
  return {
    source,
    enqueue,
    getSnapshot: () => pending,
    getServerSnapshot: () => empty,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    settle,
    setMode(next: OptionTransportMode) {
      mode = next;
    },
    nextPageKey(token: OptionRequest) {
      return token.pageKey === "first" ? "continuation:tail" : null;
    },
  };
}
