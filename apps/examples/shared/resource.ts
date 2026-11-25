import {
  beginControlsRequest,
  createResourceAdapter,
  getControlsRequestBinding,
  type EmptyKind,
  type ResourceContext,
  type ResourceRequest,
  type TableController,
  type TableDefinition,
} from "@tableweave/react";
import type { QueryFor, QuerySchema } from "@tableweave/react/contracts";
import { createFilterEvaluator } from "@tableweave/react/filters";
import { fixedNow, receivedAt } from "./records.js";

/** A deterministic in-memory SERVER transport. Never reprocess the displayed page. */
export function createExampleResource<S extends QuerySchema, T extends object>(
  D: TableDefinition<S, T>,
  C: TableController<S>,
  context: ResourceContext,
  readRecords: () => readonly T[],
) {
  const resource = createResourceAdapter<T, QueryFor<S>>(context);
  let accepted: ResourceRequest<QueryFor<S>> | null = null,
    queued: ResourceRequest<QueryFor<S>> | null = null,
    serial = 0;
  const begin = () => {
    const started = beginControlsRequest(D.native, C, resource, {
      ...context,
      queryKey: C.getSnapshot().queryIdentity,
      requestKey: `synthetic-${++serial}`,
      extent: { kind: "page", ...C.getSnapshot().query.pagination },
      retry(request) {
        queued = request;
      },
    });
    if (started) queued = started.request;
    return started;
  };
  return {
    resource,
    begin,
    bindings() {
      const current = resource.getSnapshot();
      return {
        request: current.request
          ? getControlsRequestBinding(D.native, C, resource, current.request)
          : null,
        snapshot:
          current.snapshot && accepted
            ? getControlsRequestBinding(D.native, C, resource, accepted)
            : null,
      };
    },
    succeed(kind: "known" | "unknown" = "known", empty?: EmptyKind) {
      const token = queued;
      if (!token || token !== resource.getSnapshot().request) return false;
      const input = readRecords();
      const evaluate = createFilterEvaluator<S, T>(
        D.native.controllerDefinition.schema,
        token.query,
        { ...D.native.evaluation, now: token.evaluatedAt ?? fixedNow },
      );
      const collator = new Intl.Collator(token.query.locale);
      const records = input.filter(evaluate).sort((a, b) => {
        for (const rule of token.query.sorting) {
          const left: unknown = Reflect.get(a, rule.id),
            right: unknown = Reflect.get(b, rule.id);
          const comparison =
            typeof left === "number" && typeof right === "number"
              ? left - right
              : collator.compare(String(left ?? ""), String(right ?? ""));
          if (comparison) return rule.desc ? -comparison : comparison;
        }
        return collator.compare(D.native.getRowId(a), D.native.getRowId(b));
      });
      const { pageIndex, pageSize } = token.query.pagination;
      if (empty && records.length !== 0)
        throw new Error(
          "Empty classification requires an actual empty application result",
        );
      const before = accepted;
      accepted = token;
      const success = resource.succeed(token, {
        source: "fresh",
        records: records.slice(
          pageIndex * pageSize,
          (pageIndex + 1) * pageSize,
        ),
        page:
          kind === "known"
            ? { kind, total: records.length }
            : {
                kind,
                hasNextPage: (pageIndex + 1) * pageSize < records.length,
              },
        emptyKind: empty ?? (input.length === 0 ? "dataset" : "filtered"),
        receivedAt,
      });
      if (!success) accepted = before;
      return success;
    },
    fail() {
      const token = resource.getSnapshot().request;
      return token ? resource.fail(token, "unavailable") : false;
    },
    clear() {
      accepted = null;
      queued = null;
      resource.clear();
    },
    revoke(next: ResourceContext) {
      accepted = null;
      queued = null;
      resource.setContext(next);
    },
  };
}
