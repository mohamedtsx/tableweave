import type { TableCommand } from "@tableweave/react";
import { createCriteriaFrames, defineNativeTable } from "@tableweave/react";
import {
  createQuery,
  defineQuerySchema,
  parseQuery,
} from "@tableweave/react/contracts";
import { createCriteriaDateBundle } from "../../packages/heroui/src/date/criteria-date-state.js";
import { createCriteriaCommitCell } from "../../packages/heroui/src/filters/criteria-commit.js";
import type { FilterBuilderProps } from "../../packages/heroui/src/filters/types.js";
import { ApplicationOwner } from "../criteria-bootstrap/owner.js";

export const scalarRule = {
  id: "r1",
  field: "created",
  operator: "date.on",
  value: { kind: "instant", value: "2030-01-10T12:34:56.789Z" },
} as const;
export const numberRule = {
  id: "r1",
  field: "amount",
  operator: "number.eq",
  value: 7,
} as const;
export const rangeSeed = [
  { kind: "instant", value: "2030-01-10T12:34:56.789Z" },
  { kind: "instant", value: "2030-01-11T01:02:03.456+00:00" },
] as const;
export function fixture(rules: readonly unknown[] = [scalarRule]) {
  const context = {
    definitionKey: "date-builder-draft",
    scopeKey: "synthetic-intent",
    access: true,
  };
  const schema = defineQuerySchema({
    id: "date-builder-draft",
    version: 1,
    fields: {
      id: { type: "text", owner: "search", sort: true },
      amount: { type: "number", owner: "builder" },
      created: {
        type: "datetime",
        owner: "builder",
        operators: ["date.on", "date.between", "date.before"],
        relativePresets: ["today"],
        rollingDays: [7],
      },
      otherDate: {
        type: "date",
        owner: "builder",
        operators: ["date.on", "date.between"],
      },
      standalone: { type: "date", owner: "date" },
    },
    date: { mode: "single" },
    pagination: { enabled: true, defaultSize: 25, sizes: [25] },
  });
  type S = typeof schema;
  type RecordValue = {
    id: string;
    amount: number;
    created: string;
    otherDate: string;
    standalone: string;
  };
  const records: RecordValue[] = [
    {
      id: "one",
      amount: 7,
      created: "2030-01-10T12:34:56.789Z",
      otherDate: "2030-01-10",
      standalone: "2030-01-10",
    },
  ];
  const native = defineNativeTable<S, RecordValue>({
    schema,
    selection: "multiple",
    getRowId: (row) => row.id,
    columns: [{ id: "id", accessorKey: "id" }],
    evaluation: {
      accessors: {
        amount: (row) => row.amount,
        created: (row) => row.created,
        otherDate: (row) => row.otherDate,
        standalone: (row) => row.standalone,
      },
    },
  });
  const parsed = parseQuery(schema, {
    ...createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    builder: { join: "and", rules },
  });
  if (!parsed.success)
    throw new Error("Synthetic actual initial rules invalid");
  const app = ApplicationOwner.create({
    native,
    context,
    now: () => Date.UTC(2030, 0, 1),
    initial: { query: parsed.data, selection: { one: true } },
  });
  const begun = app.prepareInitial();
  if (begun.status !== "pending" || !begun.snapshot.pending)
    throw new Error("Real initial retirement missing");
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
    throw new Error("Real initial acknowledgement missing");
  const issue = () => {
    const frame = frames.commit(
        frames.prepare({
          criteria: app.authority(),
          expected: app.context,
          source: { mode: "client", context: app.context, records },
          nativeInput: { mode: "client", records },
        }),
      ),
      pair = frames.issue(frame);
    return { owner: pair.owner, authority: pair.tool };
  };
  const cell = createCriteriaCommitCell("builder", app.C),
    bundle = createCriteriaDateBundle(cell),
    lease = cell.connect();
  const props = (
    extra: Partial<FilterBuilderProps<S>> = {},
  ): FilterBuilderProps<S> => ({
    controller: app.C,
    expectedResourceContext: context,
    invalidationKey: "synthetic-local",
    evaluationMode: "server",
    fields: {
      created: { label: "Created" },
      otherDate: { label: "Other date" },
      amount: { label: "Amount" },
    },
    ...extra,
  });
  const commit = (extra: Partial<FilterBuilderProps<S>> = {}) =>
    cell.commit(lease, issue(), props(extra));
  const actor = commit();
  const rule = (id = "r1") =>
    required(
      app.C.getSnapshot().query.builder.rules.find((item) => item.id === id),
    );
  const baseline = (id = "r1") => JSON.stringify(rule(id));
  const external = (command: TableCommand<S>) => {
    const result = app.propose(command);
    return result.status === "proposed" ? app.acceptPending() : result;
  };
  return {
    app,
    context,
    schema,
    native,
    records,
    frames,
    cell,
    bundle,
    lease,
    actor,
    commit,
    props,
    rule,
    baseline,
    external,
    issue,
    stop: () => cell.disconnect(lease),
  };
}
export type S = ReturnType<typeof fixture>["schema"];
export function required<Value>(value: Value | null | undefined): Value {
  if (value == null) throw new Error("Missing actual fixture value");
  return value;
}
