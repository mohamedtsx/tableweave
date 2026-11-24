import { StrictMode, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Pagination } from "../../../packages/heroui/src/pagination/Pagination.js";
import type {
  PaginationCorrectionContext,
  PaginationProps,
} from "../../../packages/heroui/src/pagination/types.js";
import { usePaginationCorrection } from "../../../packages/heroui/src/pagination/usePaginationCorrection.js";
import type { TableController } from "../../../packages/react/src/controller/types.js";
import { useTableweaveState } from "../../../packages/react/src/hooks/state.js";
import {
  actor,
  type Facts,
  type Item,
  poison,
  poisonedProps,
  resourceContext,
  type Schema,
  withFlag,
} from "./actors.js";
import "./fixture.css";
import "@heroui/styles/css";
import "../../../packages/heroui/src/pagination/styles.css";
import "../../controls/pagination/fixture.css";

const scenario =
  new URLSearchParams(location.search).get("case") ?? "raw-disabled";
const isHook = scenario.startsWith("hook-");
const enabled = actor(
  true,
  scenario === "focus" || isHook ? 4 : 0,
  scenario === "hook-spent",
  scenario === "focus" || scenario === "enabled" ? 12 : 3,
);
const disabled = actor(false);
const initialDisabledState = disabled.controller.getSnapshot();
const audit: string[] = [];
const reads = { count: 0, receivers: [] as boolean[] };
const hostileFacts = poison<Facts>(audit, "facts");
const hostileAuthority = poison<typeof enabled.authority>(audit, "authority");
const hostileContext = poison<PaginationCorrectionContext<Schema, Item>>(
  audit,
  "context",
);
const hostileController = poison<TableController<Schema>>(audit, "metadata");
let renderCommits = 0;
let hookEffects = 0;
let actions: {
  setDisabled: (value: boolean) => void;
  bump: () => void;
  advance: () => void;
} | null = null;
export const port = {
  observe() {
    return {
      scenario,
      renderCommits,
      hookEffects,
      audit: [...audit],
      reads: { count: reads.count, receivers: [...reads.receivers] },
      commands: [...enabled.commands],
      disabledCommands: [...disabled.commands],
      commits: [...enabled.commits],
      requests: enabled.proposals.map((proposal) => proposal.transition.reason),
      pageIndex: enabled.controller.getSnapshot().query.pagination.pageIndex,
      disabledStateUnchanged:
        disabled.controller.getSnapshot() === initialDisabledState,
    };
  },
  shrink() {
    if (!actions) throw new Error("Fixture not committed");
    enabled.replaceRecords(3);
    actions.bump();
  },
  disable() {
    if (!actions) throw new Error("Fixture not committed");
    actions.setDisabled(true);
  },
  enable() {
    if (!actions) throw new Error("Fixture not committed");
    actions.setDisabled(false);
  },
};
declare global {
  interface Window {
    pagerDisabled: typeof port;
  }
}
window.pagerDisabled = port;

function RawPager({ input }: { input: PaginationProps<Schema, Item> }) {
  return Pagination(input);
}
function HookProbe({
  off,
  epoch,
  facts,
  authority,
}: {
  off: boolean;
  epoch: number;
  facts: Facts;
  authority: typeof enabled.authority;
}) {
  const context: PaginationCorrectionContext<Schema, Item> = {
    definition: enabled.definition,
    context: resourceContext,
    epoch,
    readCurrent() {
      reads.count++;
      reads.receivers.push(this === context);
      return { context: this.context, epoch: this.epoch };
    },
  };
  const target =
    scenario === "hook-metadata-error"
      ? hostileController
      : off
        ? disabled.controller
        : enabled.controller;
  usePaginationCorrection(
    target,
    off && scenario !== "hook-disabled-looking" ? hostileFacts : facts,
    off ? hostileAuthority : authority,
    off ? hostileContext : context,
  );
  useEffect(() => {
    hookEffects++;
  });
  return null;
}
function Fixture() {
  useTableweaveState(enabled.controller);
  const [off, setOff] = useState(
    scenario === "raw-disabled" ||
      scenario.startsWith("hook-disabled") ||
      scenario === "hook-metadata-error",
  );
  const [epoch, setEpoch] = useState(0);
  const [render, setRender] = useState(0);
  // All allowing facts/authorities come from the actual registered owner/boundary.
  const facts = scenario === "raw-disabled" ? hostileFacts : enabled.facts();
  const authority =
    scenario === "raw-disabled" ? hostileAuthority : enabled.authorize();
  const props = off
    ? poisonedProps(disabled.schema, audit)
    : {
        schema: enabled.schema,
        presentation:
          scenario === "metadata-disabled"
            ? withFlag(facts, {
                get() {
                  audit.push("flag.get");
                  throw new Error("Must not read flag");
                },
              })
            : facts,
        authority,
        id: "pager",
      };
  useLayoutEffect(() => {
    renderCommits++;
    actions = {
      setDisabled: setOff,
      bump: () => setRender((value) => value + 1),
      advance: () => setEpoch((value) => value + 1),
    };
    return () => {
      actions = null;
    };
  });
  return (
    <main>
      <h1>Disabled pager source policy fixture</h1>
      <nav aria-label="Application test controls">
        <button type="button" onClick={() => setOff(true)}>
          Disable policy
        </button>
        <button type="button" onClick={() => setOff(false)}>
          Enable policy
        </button>
        <button type="button" onClick={() => setRender(render + 1)}>
          Rerender owner
        </button>
        <button
          type="button"
          onClick={() => {
            const proposal = enabled.proposals.at(-1);
            if (!proposal) throw new Error("No pending correction");
            enabled.controller.reject(proposal);
            setRender(render + 1);
          }}
        >
          Reject correction
        </button>
        <button type="button" onClick={() => setEpoch(epoch + 1)}>
          Advance epoch
        </button>
        <button type="button" id="external">
          External region
        </button>
      </nav>
      {isHook ? (
        <HookProbe
          off={off}
          epoch={epoch}
          facts={facts}
          authority={authority}
        />
      ) : (
        <RawPager input={props} />
      )}
      <output aria-label="Fixture render">{render}</output>
      <output aria-label="Fixture policy">
        {off ? "disabled" : "enabled"}
      </output>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
