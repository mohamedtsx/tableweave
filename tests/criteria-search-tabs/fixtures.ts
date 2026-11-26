import type {
  MutationResult,
  StateProposal,
  TableCommand,
} from "@tableweave/react";
import type { FilterSearchProps } from "../../packages/heroui/src/toolbar/filter-search.js";
import type { FilterTabsProps } from "../../packages/heroui/src/toolbar/filter-tabs.js";
import type { S } from "../criteria-commit/fixtures.js";
import {
  fixture as baseFixture,
  required,
} from "../criteria-commit/fixtures.js";

export type { S };
export { required };

/** Borrow the genuine, certified application/native/resource fixture unchanged.
 * This app additionally owns exact UI-returned proposals. No controller/publisher/
 * tool factories are patched and no boolean is used as permission. */
export function fixture() {
  const base = baseFixture();
  let target = base.commit(),
    pending: StateProposal<S> | null = null;
  const observed: MutationResult<S>[] = [];
  function observe(result: MutationResult<S>) {
    observed.push(result);
    if (result.status === "proposed") pending = result.proposal;
    else if (result.status !== "noop") pending = null;
  }
  function acceptUI(override?: {
    readonly selection: Readonly<Record<string, boolean>>;
  }) {
    const proposal = required(pending),
      result = base.app.C.accept(proposal, override);
    pending = null;
    return { proposal, result };
  }
  function rejectUI() {
    if (pending) {
      base.app.C.reject(pending);
      pending = null;
    }
  }
  function external(command: TableCommand<S>) {
    rejectUI();
    const result = base.app.propose(command);
    return result.status === "proposed" ? base.app.acceptPending() : result;
  }
  function reset() {
    rejectUI();
    target = base.reset();
    return target;
  }
  function search(
    extra: Partial<FilterSearchProps<S>> = {},
  ): FilterSearchProps<S> {
    return {
      ...base.search(),
      criteria: target,
      onMutation: observe,
      ...extra,
    };
  }
  function tabs(extra: Partial<FilterTabsProps<S>> = {}): FilterTabsProps<S> {
    return {
      ...base.search(),
      criteria: target,
      onMutation: observe,
      tabs: {
        all: {
          label: "All",
          count: { value: 1, description: "Synthetic total" },
        },
        active: { label: "Active" },
      },
      neutralTab: { label: "Any" },
      children: null,
      ...extra,
    };
  }
  return {
    ...base,
    observed,
    search,
    tabs,
    observe,
    acceptUI,
    rejectUI,
    external,
    reset,
    get target() {
      return target;
    },
    get pendingUI() {
      return pending;
    },
  };
}
