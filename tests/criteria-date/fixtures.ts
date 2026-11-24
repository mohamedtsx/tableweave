import type {
  MutationResult,
  StateProposal,
  TableCommand,
} from "@tableweave/react";
import { createCriteriaFrames, defineNativeTable } from "@tableweave/react";
import type { StandaloneDate } from "@tableweave/react/contracts";
import {
  createQuery,
  defineQuerySchema,
  parseQuery,
} from "@tableweave/react/contracts";
import { createCriteriaToolbarStore } from "../../packages/heroui/src/toolbar/criteria-tool-host.js";
import type { FilterDateProps } from "../../packages/heroui/src/toolbar/filter-date.js";
import { createCriteriaDateLocal } from "../../packages/heroui/src/toolbar/filter-date.js";
import { ApplicationOwner } from "../criteria-bootstrap/owner.js";

export function fixture(
  type: "date" | "datetime" = "datetime",
  mode: "single" | "range" = "single",
  initial: StandaloneDate | null = null,
) {
  const context = {
    definitionKey: "criteria-date",
    scopeKey: "synthetic-date",
    access: true,
  };
  const dateField =
    type === "date"
      ? {
          type: "date" as const,
          owner: "date" as const,
          relativePresets: ["today", "yesterday"] as const,
          rollingDays: [7],
        }
      : {
          type: "datetime" as const,
          owner: "date" as const,
          relativePresets: ["today", "yesterday"] as const,
          rollingDays: [7],
        };
  const shape = {
    id: "criteria-date",
    version: 1,
    fields: {
      id: { type: "text", owner: "search", sort: true },
      date: dateField,
      builderDate: {
        type: "datetime",
        owner: "builder",
        operators: ["date.on", "date.between"],
      },
    },
    pagination: { enabled: true, defaultSize: 25, sizes: [25] },
  } as const;
  const schema =
    mode === "single"
      ? defineQuerySchema({ ...shape, date: { mode: "single" } })
      : defineQuerySchema({ ...shape, date: { mode: "range" } });
  type S = typeof schema;
  const native = defineNativeTable<
    S,
    { id: string; date: string; builderDate: string }
  >({
    schema,
    selection: "multiple",
    getRowId: (row) => row.id,
    columns: [{ id: "id", accessorKey: "id" }],
    evaluation: {
      accessors: {
        date: (row) => row.date,
        builderDate: (row) => row.builderDate,
      },
    },
  });
  const parsed = parseQuery(schema, {
    ...createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    date: initial,
  });
  if (!parsed.success)
    throw new Error("Synthetic initial date rejected by actual normalizer");
  const app = ApplicationOwner.create({
    native,
    context,
    now: () => Date.UTC(2030, 0, 1),
    initial: { query: parsed.data, selection: { one: true } },
  });
  const begun = app.prepareInitial();
  if (begun.status !== "pending" || !begun.snapshot.pending)
    throw new Error("Actual bootstrap missing");
  const authority = app.P.issue({
    controller: app.C,
    definition: app.CD,
    context,
    epoch: begun.snapshot.pending.epoch,
  });
  const frames = createCriteriaFrames({
    nativeDefinition: native,
    controller: app.C,
    publication: app.P,
    criteria: authority,
  });
  if (app.completeInitial(begun.ticket).status !== "settled")
    throw new Error("Actual retirement acknowledgement missing");
  const records = [
    {
      id: "one",
      date: type === "date" ? "2030-01-10" : "2030-01-10T00:00:00.000Z",
      builderDate: "2030-01-10T00:00:00.000Z",
    },
  ];
  const issue = () => {
    const frame = frames.commit(
      frames.prepare({
        criteria: app.authority(),
        expected: app.context,
        source: { mode: "client", context: app.context, records },
        nativeInput: { mode: "client", records },
      }),
    );
    const pair = frames.issue(frame);
    return { owner: pair.owner, authority: pair.tool };
  };
  let target = issue(),
    pending: StateProposal<S> | null = null;
  const observed: MutationResult<S>[] = [];
  const observe = (result: MutationResult<S>) => {
    observed.push(result);
    if (result.status === "proposed") pending = result.proposal;
    else if (result.status !== "noop") pending = null;
  };
  const props = (
    extra: Partial<FilterDateProps<S>> = {},
  ): FilterDateProps<S> => ({
    controller: app.C,
    criteria: target,
    expectedContext: app.context,
    onMutation: observe,
    ...extra,
  });
  const reject = () => {
    if (pending) {
      app.C.reject(pending);
      pending = null;
    }
  };
  const accept = () => {
    if (!pending) throw new Error("Actual UI receipt missing");
    const proposal = pending;
    const result = app.C.accept(proposal);
    pending = null;
    return result;
  };
  const external = (command: TableCommand<S>) => {
    reject();
    const result = app.propose(command);
    return result.status === "proposed" ? app.acceptPending() : result;
  };
  const reset = () => {
    reject();
    const result = app.beginReset();
    if (
      result.status !== "pending" ||
      app.completeReset(result.ticket).status !== "settled"
    )
      throw new Error("Real reset blocked");
    target = issue();
    return target;
  };
  const store = createCriteriaToolbarStore("date", createCriteriaDateLocal<S>);
  return {
    app,
    schema,
    native,
    frames,
    context,
    records,
    store,
    props,
    observe,
    observed,
    accept,
    reject,
    external,
    reset,
    issue,
    get target() {
      return target;
    },
    get pending() {
      return pending;
    },
  };
}
export type Fixture = ReturnType<typeof fixture>;
export type S = Fixture["schema"];
export function required<Value>(value: Value | null | undefined): Value {
  if (value == null) throw new Error("Missing actual fixture value");
  return value;
}
