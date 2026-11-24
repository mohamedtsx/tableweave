import { parseQuery } from "@tableweave/react/contracts";
import {
  getCookie,
  getRequest,
  setResponseHeader,
} from "@tanstack/react-start/server";
import {
  definitionKey,
  fixtureClock,
  identity,
  initialQuery,
  schema,
} from "./schema";
import {
  type Actor,
  type BootstrapOutcome,
  type CanaryOutcome,
  modes,
  type ReadInput,
  type ReadStats,
  type RecordRow,
  type RowsOutcome,
} from "./types";

// Synthetic, immutable fixtures. These markers must never reach a client bundle.
const serverOnlyMarker = "WP06_SERVER_READER_FIXTURES_NOT_CLIENT_CODE";
const rows: Readonly<Record<Actor, readonly RecordRow[]>> = {
  alpha: makeRows("alpha", "Alpha"),
  beta: makeRows("beta", "Beta"),
};
function makeRows(actor: Actor, title: string): readonly RecordRow[] {
  return Object.freeze(
    Array.from({ length: 24 }, (_, index) =>
      Object.freeze({
        id: `${actor}-${String(index + 1).padStart(2, "0")}`,
        label: `${title} record ${String(index + 1).padStart(2, "0")}`,
        amount: Math.floor(index / 2),
        status: index % 2 === 0 ? ("active" as const) : ("paused" as const),
      }),
    ),
  );
}
const stats: Record<
  Actor,
  { reads: number; aborted: number; completed: number }
> = {
  alpha: { reads: 0, aborted: 0, completed: 0 },
  beta: { reads: 0, aborted: 0, completed: 0 },
};
export function currentActor(): Actor {
  const actor = authorizedActor();
  if (actor === null) throw new Error("Synthetic access denied.");
  return actor;
}
function authorizedActor(): Actor | null {
  const actor = getCookie("wp06-actor") ?? "alpha";
  return actor === "alpha" || actor === "beta" ? actor : null;
}
export function privateResponse(): void {
  setResponseHeader("Cache-Control", "private, no-store");
}
export function bootstrapReader(): BootstrapOutcome {
  privateResponse();
  const actor = authorizedActor();
  if (actor === null) return { kind: "access-lost", code: "access-lost" };
  return {
    kind: "authorized",
    bootstrap: {
      definitionKey,
      scopeKey: `demo:${actor}`,
      clock: fixtureClock,
      query: initialQuery(),
      tableId: "wp06-table",
    },
  };
}
export function canaryReader(): CanaryOutcome {
  privateResponse();
  const actor = authorizedActor();
  if (actor === null) return { kind: "access-lost", code: "access-lost" };
  return {
    kind: "authorized",
    canary: { scopeKey: `demo:${actor}`, value: `request-canary-${actor}` },
  };
}
export function statsReader(): ReadStats {
  return { ...stats[currentActor()] };
}
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function validateRead(value: unknown): ReadInput {
  if (
    !object(value) ||
    Object.keys(value).some(
      (key) =>
        !["scopeKey", "clock", "query", "requestKey", "mode"].includes(key),
    )
  )
    throw new Error("Invalid synthetic request.");
  const { scopeKey, clock, requestKey, mode } = value;
  if (
    typeof scopeKey !== "string" ||
    clock !== fixtureClock ||
    typeof requestKey !== "string" ||
    !/^[a-zA-Z0-9:-]{1,80}$/.test(requestKey) ||
    typeof mode !== "string"
  )
    throw new Error("Invalid synthetic request.");
  const selectedMode = modes.find((candidate) => candidate === mode);
  const parsed = parseQuery(schema, value.query);
  if (
    !selectedMode ||
    !parsed.success ||
    parsed.data.locale !== "en-US" ||
    parsed.data.timeZone !== "UTC"
  )
    throw new Error("Invalid synthetic query.");
  return {
    scopeKey,
    clock,
    requestKey,
    mode: selectedMode,
    query: parsed.data,
  };
}
function pause(
  milliseconds: number,
  signal: AbortSignal,
  actor: Actor,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      stats[actor].aborted++;
      reject(new Error("Request canceled."));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      stats[actor].aborted++;
      reject(new Error("Request canceled."));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}
export async function readRows(
  input: ReadInput,
  signal: AbortSignal,
): Promise<RowsOutcome> {
  // Revalidate at the actual application boundary even after RPC validation.
  const validated = validateRead(input);
  const actor = authorizedActor();
  privateResponse();
  if (
    actor === null ||
    validated.scopeKey !== `demo:${actor}` ||
    validated.mode === "deny"
  )
    return { kind: "access-lost", code: "access-lost" };
  if (!serverOnlyMarker) throw new Error("Fixture unavailable.");
  stats[actor].reads++;
  if (validated.mode === "slow") await pause(550, signal, actor);
  else if (validated.mode === "uncancellable")
    await new Promise((resolve) => setTimeout(resolve, 650));
  else await pause(15, signal, actor);
  if (validated.mode === "fail")
    throw new Error("Synthetic reader unavailable.");
  const query = validated.query;
  let filtered = rows[actor].filter((row) => {
    if (
      query.search &&
      !row.label
        .toLocaleLowerCase(query.locale)
        .includes(query.search.toLocaleLowerCase(query.locale))
    )
      return false;
    if (query.tabId === "active" && row.status !== "active") return false;
    const predicates = query.builder.rules.map((rule) => {
      if (rule.field !== "amount" || typeof rule.value !== "number")
        throw new Error("Invalid synthetic predicate.");
      switch (rule.operator) {
        case "number.gte":
          return row.amount >= rule.value;
        case "number.lt":
          return row.amount < rule.value;
        case "number.eq":
          return row.amount === rule.value;
        default:
          throw new Error("Invalid synthetic predicate.");
      }
    });
    return (
      !predicates.length ||
      (query.builder.join === "and"
        ? predicates.every(Boolean)
        : predicates.some(Boolean))
    );
  });
  filtered.sort((a, b) => {
    for (const sort of query.sorting) {
      const difference =
        sort.id === "amount"
          ? a.amount - b.amount
          : sort.id === "label"
            ? a.label.localeCompare(b.label, query.locale)
            : 0;
      if (difference) return sort.desc ? -difference : difference;
    }
    return a.id.localeCompare(b.id, "en-US");
  });
  if (validated.mode === "empty") filtered = [];
  if (validated.mode === "shrink") filtered = filtered.slice(0, 3);
  const { pageIndex, pageSize } = query.pagination;
  if (validated.mode === "unknown-last")
    filtered = filtered.slice(0, (pageIndex + 1) * pageSize);
  const correctedPage =
    pageIndex >= Math.max(1, Math.ceil(filtered.length / pageSize))
      ? Math.max(0, Math.ceil(filtered.length / pageSize) - 1)
      : null;
  const pageRecords = filtered.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );
  const records =
    validated.mode === "uncancellable"
      ? pageRecords.map((row) => ({
          ...row,
          label: `${row.label} (older response)`,
        }))
      : pageRecords;
  stats[actor].completed++;
  return {
    kind: "ready",
    result: {
      source: "fresh",
      scopeKey: validated.scopeKey,
      queryKey: identity(query, validated.clock),
      requestKey: validated.requestKey,
      records,
      page:
        validated.mode === "unknown" || validated.mode === "unknown-last"
          ? {
              kind: "unknown",
              hasNextPage:
                validated.mode !== "unknown-last" &&
                (pageIndex + 1) * pageSize < filtered.length,
            }
          : { kind: "known", total: filtered.length },
      emptyKind:
        query.search || query.builder.rules.length || query.tabId === "active"
          ? "filtered"
          : "dataset",
      receivedAt: new Date(validated.clock).toISOString(),
      correctedPage,
    },
  };
}
export function requestSignal(): AbortSignal {
  return getRequest().signal;
}
