import { canonicalJson } from "../../../packages/react/src/contracts/json.js";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import { createTableController } from "../../../packages/react/src/controller/store.js";
import type {
  ControllerOptions,
  TableCommand,
} from "../../../packages/react/src/controller/types.js";

export const NOW = Date.parse("2026-03-08T12:00:00Z");
export function schemaFor(enabled?: boolean, version = 1) {
  return defineQuerySchema({
    id: "u1-pagination",
    version,
    fields: {
      amount: { type: "number", owner: "builder", sort: true },
      title: { type: "text", owner: "search", sort: true },
      day: { type: "date", owner: "date", relativePresets: ["today"] },
    },
    date: { mode: "single" },
    pagination: {
      ...(enabled === undefined ? {} : { enabled }),
      defaultSize: 10,
      sizes: [10, 25],
    },
  });
}
export type S = ReturnType<typeof schemaFor>;
export type Command = TableCommand<S>;
export function fixture(
  enabled?: boolean,
  controlled = false,
  extra: Partial<ControllerOptions<S>> = {},
) {
  const schema = schemaFor(enabled);
  const log: string[] = [];
  const counts = {
    clock: 0,
    command: 0,
    state: 0,
    request: 0,
    commit: 0,
    query: 0,
    subscriber: 0,
    updater: 0,
  };
  const store = createTableController(
    { schema, selection: true, columns: [{ id: "amount" }, { id: "title" }] },
    {
      initial: {
        query: createQuery(schema, {
          locale: "en-US",
          timeZone: "UTC",
          pagination: { pageIndex: enabled === false ? 0 : 3, pageSize: 10 },
        }),
        selection: { synthetic: true },
      },
      ...(controlled ? { controlled: ["query"] as const } : {}),
      now() {
        counts.clock++;
        log.push("clock");
        return NOW;
      },
      validateCommand(command) {
        counts.command++;
        log.push(`command:${command.type}`);
      },
      validateState() {
        counts.state++;
        log.push("state");
      },
      onRequest() {
        counts.request++;
        log.push("request");
      },
      onCommit() {
        counts.commit++;
        log.push("commit");
      },
      onQueryChange() {
        counts.query++;
        log.push("query");
      },
      ...extra,
    },
  );
  store.subscribe(() => {
    counts.subscriber++;
    log.push("subscriber");
  });
  const reset = () => {
    for (const key of Object.keys(counts) as (keyof typeof counts)[])
      counts[key] = 0;
    log.length = 0;
  };
  reset();
  return { schema, store, log, counts, reset };
}
export const actions = [
  "same",
  "previous",
  "index",
  "size",
  "clamp-zero",
  "clamp-stale",
] as const;
export function commandFor(
  f: ReturnType<typeof fixture>,
  action: (typeof actions)[number],
): Command {
  const old = f.store.getSnapshot();
  if (action === "same")
    return { type: "pagination.change", update: { ...old.query.pagination } };
  if (action === "previous")
    return {
      type: "pagination.change",
      update(previous) {
        f.counts.updater++;
        f.log.push("updater");
        return previous;
      },
    };
  if (action === "index")
    return {
      type: "pagination.change",
      update: { pageIndex: 2, pageSize: 10 },
    };
  if (action === "size")
    return {
      type: "pagination.change",
      update: { pageIndex: 3, pageSize: 25 },
    };
  return {
    type: "pagination.clamp",
    pageCount: 0,
    queryIdentity:
      action === "clamp-stale" ? "synthetic-stale" : old.queryIdentity,
  };
}
export function pagedCase(
  enabled: boolean | undefined,
  controlled: boolean,
  action: (typeof actions)[number],
) {
  const f = fixture(enabled, controlled),
    initial = f.store.getSnapshot();
  let outcome: unknown;
  try {
    const r = f.store.dispatch(commandFor(f, action));
    outcome = { status: r.status };
    if (r.status === "proposed")
      outcome = { status: r.status, accept: f.store.accept(r.proposal).status };
  } catch (error) {
    outcome = {
      error:
        error && typeof error === "object" && "code" in error
          ? error.code
          : "unexpected",
    };
  }
  const final = f.store.getSnapshot();
  return {
    schema: canonicalJson(f.schema),
    definition: canonicalJson(f.store.getDefinition()),
    initialQuery: canonicalJson(initial.query),
    initialIdentity: initial.queryIdentity,
    initialFilter: initial.filterIdentity,
    finalQuery: canonicalJson(final.query),
    finalIdentity: final.queryIdentity,
    finalFilter: final.filterIdentity,
    snapshotSame: initial === final,
    outcome,
    log: f.log,
    counts: f.counts,
  };
}
