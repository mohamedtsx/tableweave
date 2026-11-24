import { expect, test } from "vitest";
import {
  requireCriteriaSource,
  requireCriteriaTool,
} from "../../../packages/react/src/presentation/criteria-frame.js";
import { projectDataTableRecovery } from "../../../packages/react/src/table/recovery.js";
import { fixture, records, required } from "./fixtures.js";

for (const enabled of [true, false])
  for (const mode of ["client", "server", "server-complete"] as const)
    test(`genuine facade derivation policy=${enabled}, mode=${mode}`, () => {
      const f = fixture(enabled);
      expect(f.app.settle().status).toBe("settled");
      if (mode !== "client") {
        const request = f.start();
        f.succeed(request.request);
      }
      if (
        mode !== "client" &&
        (enabled ? mode !== "server" : mode !== "server-complete")
      ) {
        f.resetCounts();
        expect(() => f.commit(mode)).toThrow();
        expect(f.counts.rowId).toBe(0);
        return;
      }
      const result = f.commit(mode),
        metadata = requireCriteriaSource(result.source, result.owner);
      expect(result.frame?.view.controller).toBe(f.app.C);
      expect(result.frame?.view.state).toBe(f.app.C.getSnapshot());
      expect(result.frame?.view.rows.length).toBe(enabled ? 25 : 173);
      expect(result.presentation?.displayed?.extent.kind).toBe(
        enabled ? "page" : "complete",
      );
      if (mode === "server-complete")
        expect(result.frame?.view.rows.map((row) => row.original)).toEqual(
          f.resource.getSnapshot().snapshot?.records,
        );
      expect(
        projectDataTableRecovery({
          phase: "display",
          metadata,
          presentation: result.presentation,
          clientInputCount: result.clientInputCount,
        }).kind,
      ).toBe("records");
      expect(
        requireCriteriaTool(required(result.pair).tool, result.owner)
          .controller,
      ).toBe(f.app.C);
    });
for (const kind of ["dataset", "filtered", "unknown"] as const)
  test(`remote empty cause is actual supplied ${kind}, not inferred from zero`, () => {
    const f = fixture();
    f.app.settle();
    const request = f.start();
    f.succeed(request.request, [], kind);
    const result = f.commit("server");
    const recovery = projectDataTableRecovery({
      phase: "display",
      metadata: requireCriteriaSource(result.source, result.owner),
      presentation: result.presentation,
      clientInputCount: null,
    });
    expect(recovery).toMatchObject({ kind: "empty", cause: kind });
  });
test("client dataset/filtered zero and nonzero-total out-of-range page are distinct without custom recovery compilation", () => {
  for (const filtered of [false, true]) {
    const f = fixture(true, filtered ? "custom" : "none");
    f.app.settle();
    const result = f.commit("client", filtered ? records : []);
    f.resetCounts();
    expect(
      projectDataTableRecovery({
        phase: "display",
        metadata: requireCriteriaSource(result.source, result.owner),
        presentation: result.presentation,
        clientInputCount: result.clientInputCount,
      }),
    ).toMatchObject({
      kind: "empty",
      cause: filtered ? "filtered" : "dataset",
    });
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
  }
  const f = fixture();
  f.app.settle();
  f.app.change({
    type: "pagination.change",
    update: { pageIndex: 10, pageSize: 25 },
  });
  const result = f.commit();
  expect(result.presentation?.displayed?.pageInfo).toEqual({
    kind: "known",
    total: 173,
  });
  expect(
    projectDataTableRecovery({
      phase: "display",
      metadata: requireCriteriaSource(result.source, result.owner),
      presentation: result.presentation,
      clientInputCount: result.clientInputCount,
    }),
  ).toMatchObject({ kind: "empty", cause: "no-record-on-page" });
});
test("retained snapshot A records/empty stay A with B pending/failure; fresh zero replaces A", () => {
  for (const initiallyEmpty of [false, true]) {
    const f = fixture();
    f.app.settle();
    const a = f.start();
    f.succeed(a.request, initiallyEmpty ? [] : records.slice(0, 4), "filtered");
    const originQuery = a.request.query,
      originTime = a.binding.evaluatedAt;
    f.app.change({ type: "search.commit", search: "B" });
    const b = f.start(() => {});
    const pending = f.commit("server");
    expect(pending.presentation?.displayed?.query).toBe(originQuery);
    expect(pending.presentation?.displayed?.evaluatedAt).toBe(originTime);
    expect(pending.presentation?.displayed?.recordCount).toBe(
      initiallyEmpty ? 0 : 4,
    );
    expect(
      projectDataTableRecovery({
        phase: "display",
        metadata: requireCriteriaSource(pending.source, pending.owner),
        presentation: pending.presentation,
        clientInputCount: null,
      }),
    ).toMatchObject({
      kind: initiallyEmpty ? "updating-empty" : "records",
      notice: "updating",
      busy: true,
      stale: true,
    });
    f.resource.fail(b.request, "timeout");
    const failure = f.commit("server");
    expect(
      projectDataTableRecovery({
        phase: "display",
        metadata: requireCriteriaSource(failure.source, failure.owner),
        presentation: failure.presentation,
        clientInputCount: null,
      }),
    ).toMatchObject({
      kind: initiallyEmpty ? "empty" : "records",
      notice: "update-failed",
      canRetry: true,
    });
    const c = f.start();
    f.succeed(c.request, [], "dataset");
    const fresh = f.commit("server");
    expect(fresh.frame?.view.rows).toHaveLength(0);
    expect(fresh.presentation?.displayed?.range).toEqual({ from: 0, to: 0 });
    expect(
      projectDataTableRecovery({
        phase: "display",
        metadata: requireCriteriaSource(fresh.source, fresh.owner),
        presentation: fresh.presentation,
        clientInputCount: null,
      }),
    ).toMatchObject({ kind: "empty", cause: "dataset", stale: false });
  }
});
test("no snapshot initial failure has only a genuine source capability and finite safe Retry eligibility", () => {
  const f = fixture();
  f.app.settle();
  let retries = 0;
  const request = f.start(() => {
    retries++;
  });
  f.resource.fail(request.request, "offline");
  f.resetCounts();
  const result = f.commit("server"),
    metadata = requireCriteriaSource(result.source, result.owner);
  expect(result.frame).toBeNull();
  expect(result.pair).toBeNull();
  expect(
    projectDataTableRecovery({
      phase: "no-display",
      metadata,
      presentation: null,
      clientInputCount: null,
    }),
  ).toEqual({ kind: "initial-error", error: "offline", canRetry: true });
  expect(retries).toBe(0);
  expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
});
