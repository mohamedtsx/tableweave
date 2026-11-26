import type { MutationResult, StateProposal, TableCommand } from "@tableweave/react";
import { createCriteriaFrames, defineNativeTable } from "@tableweave/react";
import { createQuery, defineQuerySchema, parseQuery } from "@tableweave/react/contracts";
import { createOptionSource } from "@tableweave/react/filters";
import { createCriteriaBuilderStore, builderActions, builderEditor } from "../../packages/heroui/src/filters/criteria-builder-host.js";
import type { FilterBuilderProps } from "../../packages/heroui/src/filters/types.js";
import { ApplicationOwner } from "../criteria-bootstrap/owner.js";

export const numberRule = { id: "n1", field: "amount", operator: "number.eq", value: 7 } as const;
export const dateRule = { id: "d1", field: "created", operator: "date.on", value: { kind: "instant", value: "2030-01-10T12:34:56.789Z" } } as const;
export const choiceRules = [
  { id: "c1", field: "status", operator: "enum.anyOf", value: ["a", "b"] },
  { id: "c2", field: "status", operator: "enum.is", value: "c" },
] as const;

/** Application fixture, never a permitting controller/source replacement. */
export function fixture(rules: readonly unknown[] = [numberRule, dateRule]) {
  const context = { definitionKey: "criteria-builder", scopeKey: "synthetic-builder", access: true };
  const schema = defineQuerySchema({
    id: "criteria-builder", version: 1,
    fields: {
      id: { type: "text", owner: "search", sort: true },
      amount: { type: "number", owner: "builder" },
      note: { type: "text", owner: "builder" },
      status: { type: "enum", owner: "builder", values: ["a", "b", "c"] },
      created: { type: "datetime", owner: "builder", operators: ["date.on", "date.between", "date.before"] },
      otherDate: { type: "date", owner: "builder" },
      standalone: { type: "date", owner: "date" },
    },
    date: { mode: "single" },
    pagination: { enabled: true, defaultSize: 25, sizes: [25] },
  });
  type S = typeof schema;
  const records = [{ id: "one", amount: 7, note: "synthetic", status: "a" as const, created: dateRule.value.value, otherDate: "2030-01-10", standalone: "2030-01-10" }];
  const native = defineNativeTable<S, (typeof records)[number]>({
    schema, selection: "multiple", getRowId: row => row.id,
    columns: [{ id: "id", accessorKey: "id" }],
    evaluation: { accessors: {
      amount: row => row.amount, note: row => row.note, status: row => row.status,
      created: row => row.created, otherDate: row => row.otherDate, standalone: row => row.standalone,
    } },
  });
  const parsed = parseQuery(schema, { ...createQuery(schema, { locale: "en-US", timeZone: "UTC" }), builder: { join: "and", rules } });
  if (!parsed.success) throw new Error("Invalid synthetic rules");
  const app = ApplicationOwner.create({ native, context, now: () => Date.UTC(2030, 0, 1), initial: { query: parsed.data, selection: { one: true } } });
  const initial = app.prepareInitial();
  if (initial.status !== "pending" || !initial.snapshot.pending) throw new Error("Initial acknowledgement missing");
  const criteria = app.P.issue({ controller: app.C, definition: app.CD, context, epoch: initial.snapshot.pending.epoch });
  const frames = createCriteriaFrames({ nativeDefinition: native, controller: app.C, publication: app.P, criteria });
  if (app.completeInitial(initial.ticket).status !== "settled") throw new Error("Initial publication not settled");
  const issue = () => {
    const frame = frames.commit(frames.prepare({ criteria: app.authority(), expected: app.context, source: { mode: "client", context: app.context, records }, nativeInput: { mode: "client", records } }));
    const pair = frames.issue(frame);
    return { owner: pair.owner, authority: pair.tool };
  };
  let target = issue(), pending: StateProposal<S> | null = null;
  const observed: MutationResult<S>[] = [];
  const observe = (result: MutationResult<S>) => {
    observed.push(result);
    if (result.status === "proposed") pending = result.proposal;
    else if (result.status !== "noop") pending = null;
  };
  const reject = () => { if (pending) { app.C.reject(pending); pending = null; } };
  // Rejection happens after P's deny-first boundary and before genuine selection
  // retirement, not before begin and not in a fake permitting authority.
  app.faults.beforeRetire = reject;
  const accept = () => { if (!pending) throw new Error("UI proposal missing"); const result = app.C.accept(pending); pending = null; return result; };
  const external = (command: TableCommand<S>) => { reject(); const result = app.propose(command); return result.status === "proposed" ? app.acceptPending() : result; };
  const sourceFaults = { refusal: false }, invalidations: { reason: string; context: object }[] = [];
  const source = createOptionSource<string>({ ...context, fieldId: "status" }, { onInvalidate(event) {
    invalidations.push({ reason: event.reason, context: event.previous });
    if (sourceFaults.refusal) throw new Error("Synthetic owner reset refusal");
    return undefined; // Explicit application-owned synchronous reset acknowledgement.
  } });
  const props = (extra: Partial<FilterBuilderProps<S>> = {}): FilterBuilderProps<S> => ({
    controller: app.C, criteria: target, expectedResourceContext: app.context,
    invalidationKey: "builder-session", evaluationMode: "server",
    fields: { amount: { label: "Amount" }, note: { label: "Note" }, status: { label: "Status" }, created: { label: "Created" }, otherDate: { label: "Other date" } },
    onMutation: observe, ...extra,
  });
  const store = createCriteriaBuilderStore<S>();
  const commit = (extra: Partial<FilterBuilderProps<S>> = {}) => { store.commit(props(extra)); return required(store.read()).actor; };
  const open = (id: string, part: "field" | "operator" | "value" | "options" = "value") => {
    const frame = required(store.read());
    builderActions.open(store, frame.actor, `${id}:${part}`, part, required(frame.local.receipt.read(frame.actor)).token, id);
    return builderEditor(store, frame.actor);
  };
  const reset = () => { const begun = app.beginReset(); if (begun.status !== "pending" || app.completeReset(begun.ticket).status !== "settled") throw new Error("Real reset refused"); target = issue(); return target; };
  return { app, schema, context, native, records, frames, store, props, issue, commit, open, source, sourceFaults, invalidations, observe, observed, accept, reject, external, reset,
    get target() { return target; }, get pending() { return pending; } };
}
export type Fixture = ReturnType<typeof fixture>;
export type S = Fixture["schema"];
export function required<T>(value: T | null | undefined): T { if (value == null) throw new Error("Missing actual fixture value"); return value; }
