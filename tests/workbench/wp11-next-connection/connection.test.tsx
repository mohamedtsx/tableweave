import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { getQueryIdentity } from "@tableweave/react/contracts";
import ClientDataTableBoundary from "../../../apps/example-next/app/ClientDataTableBoundary.js";
import {
  createClientOwner,
  type ClientOwner,
} from "../../../apps/example-next/lib/client-owner.js";
import { buildInitialPayload } from "../../../apps/example-next/lib/server-contract.js";
import { fixedNow } from "../../../apps/examples/shared/records.js";
import { minimalTransactionSchema } from "../../../apps/examples/shared/schemas.js";

function expectReleased(source: ClientOwner) {
  const { app } = source;
  expect(app.getSnapshot().access).toBe(false);
  expect(app.getSnapshot().records).toEqual([]);
  expect(app.getSnapshot().proposal).toBeNull();
  expect(app.record("tx-001")).toBeUndefined();
  const input = app.modelOptions().source;
  expect(input.mode).toBe("client");
  if (input.mode !== "client")
    throw new Error("Unexpected example source mode");
  expect(input.context.access).toBe(false);
  expect(input.records).toEqual([]);
  expect(Object.values(app.C.getSnapshot().selection).some(Boolean)).toBe(
    false,
  );
  expect(app.C.getSnapshot().details.rowId).toBeNull();
  expect(app.remote.resource.getSnapshot().snapshot).toBeNull();
  expect(app.C.isDisposed()).toBe(false);
}

test("genuine useDataTable SSR remains a neutral status, not fabricated native rows or hydration proof", () => {
  const html = renderToString(
    <StrictMode>
      <ClientDataTableBoundary initial={buildInitialPayload("primary")} />
    </StrictMode>,
  );
  expect(html).toContain('role="status"');
  expect(html).not.toContain("<table");
  expect(html).not.toContain("Transfer note 01");
});

test("immediate Strict-style release/replay keeps the same genuine C/P and publication", async () => {
  const source = createClientOwner(buildInitialPayload("primary"));
  const { C, P } = source.app,
    publication = P.getSnapshot().current,
    authority = source.app.criteria();
  const stop = source.connect();
  stop();
  expectReleased(source);
  const replayStop = source.connect();
  try {
    await Promise.resolve();
    expect(source.app.C).toBe(C);
    expect(source.app.P).toBe(P);
    expect(P.getSnapshot().current).toBe(publication);
    expect(source.app.criteria()).toBe(authority);
    expect(source.app.getSnapshot().records).toHaveLength(24);
    expect(C.isDisposed()).toBe(false);
  } finally {
    replayStop();
  }
  await Promise.resolve();
  expectReleased(source);
});

test("genuinely delayed retained reattach crosses microtasks and a later task without reminting C/P or authority", async () => {
  const source = createClientOwner(buildInitialPayload("primary"));
  const { C, P } = source.app,
    publication = P.getSnapshot().current,
    authority = source.app.criteria();
  const stop = source.connect();
  source.app.dispatch({
    type: "pagination.change",
    update: { pageIndex: 1, pageSize: 10 },
  });
  stop();
  expectReleased(source);
  await Promise.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expectReleased(source);
  const laterStop = source.connect();
  try {
    expect(source.app.C).toBe(C);
    expect(source.app.P).toBe(P);
    expect(P.getSnapshot().current).toBe(publication);
    expect(source.app.criteria()).toBe(authority);
    expect(C.getSnapshot().query.pagination.pageIndex).toBe(1);
    expect(source.app.getSnapshot().access).toBe(true);
    expect(source.app.getSnapshot().records).toHaveLength(24);
  } finally {
    laterStop();
  }
  expectReleased(source);
  // A real event-loop delay probes the adapter contract only, not React Activity
  // or retained Next scheduling. No assertion treats GC as a disposal receipt.
});

test("stale and duplicate disconnects cannot retire a replacement connection", () => {
  const source = createClientOwner(buildInitialPayload("primary"));
  const oldStop = source.connect();
  oldStop();
  oldStop();
  const currentStop = source.connect();
  try {
    oldStop();
    oldStop();
    expect(source.app.getSnapshot().access).toBe(true);
    expect(source.app.getSnapshot().records).toHaveLength(24);
    expect(() => source.connect()).toThrow("cannot reconnect");
  } finally {
    currentStop();
    currentStop();
  }
  expectReleased(source);
});

test("release synchronously removes display inputs; reentrant attach/release never falsely attaches", () => {
  const source = createClientOwner(buildInitialPayload("primary"));
  let observe = false,
    callbacks = 0;
  const unsubscribe = source.app.subscribe(() => {
    if (!observe) return;
    callbacks++;
    expect(() => source.connect()).toThrow("cannot reconnect");
  });
  try {
    observe = true;
    const stop = source.connect();
    expect(callbacks).toBeGreaterThan(0);
    callbacks = 0;
    stop();
    expect(callbacks).toBeGreaterThan(0);
    expectReleased(source);
    observe = false;
    const stopAgain = source.connect();
    stopAgain();
    expectReleased(source);
  } finally {
    unsubscribe();
  }
});

test("terminal application revocation cannot be undone by a later connect", async () => {
  const source = createClientOwner(buildInitialPayload("primary"));
  const stop = source.connect();
  source.app.revoke();
  stop();
  await Promise.resolve();
  const afterRevocation = source.connect();
  try {
    expectReleased(source);
    expect(
      source.app.dispatch({
        type: "pagination.change",
        update: { pageIndex: 1, pageSize: 10 },
      }),
    ).toBeUndefined();
  } finally {
    afterRevocation();
  }
  expectReleased(source);
});

test("independent genuine owners retain all original query/identity/isolation assertions without terminal cleanup fiction", () => {
  const a = createClientOwner(buildInitialPayload("primary")),
    b = createClientOwner(buildInitialPayload("comparison"));
  const stopA = a.connect(),
    stopB = b.connect();
  try {
    expect(a.app.C).not.toBe(b.app.C);
    expect(a.app.P).not.toBe(b.app.P);
    expect(a.app.C.getSnapshot().queryIdentity).toBe(a.initial.queryIdentity);
    expect(b.app.C.getSnapshot().queryIdentity).toBe(b.initial.queryIdentity);
    a.app.dispatch({
      type: "pagination.change",
      update: { pageIndex: 1, pageSize: 10 },
    });
    expect(a.app.C.getSnapshot().query.pagination.pageIndex).toBe(1);
    expect(b.app.C.getSnapshot().query.pagination.pageIndex).toBe(0);
    stopA();
    expectReleased(a);
    expect(b.app.getSnapshot().access).toBe(true);
    const reconnectA = a.connect();
    try {
      a.app.revoke();
      expect(a.app.getSnapshot().access).toBe(false);
      expect(b.app.getSnapshot().access).toBe(true);
    } finally {
      reconnectA();
    }
  } finally {
    stopA();
    stopB();
  }
  expectReleased(a);
  expectReleased(b);
});

test("real source callback failures leave the adapter closed and the genuine application revoked, not disposed", () => {
  const source = createClientOwner(buildInitialPayload("primary"));
  let failOnce = true;
  const unsubscribe = source.app.subscribe(() => {
    if (failOnce) {
      failOnce = false;
      throw new Error("Real source observer failed");
    }
  });
  try {
    expect(() => source.connect()).toThrow("Real source observer failed");
    expectReleased(source);
    expect(() => source.connect()).toThrow("cannot reconnect");
  } finally {
    unsubscribe();
  }
});

test("a throwing release remains closed, preserves failure and cannot grant a new connection", () => {
  const source = createClientOwner(buildInitialPayload("primary"));
  const stop = source.connect();
  let failOnce = true;
  const unsubscribe = source.app.subscribe(() => {
    if (failOnce) {
      failOnce = false;
      throw new Error("Real release observer failed");
    }
  });
  try {
    expect(stop).toThrow("Real release observer failed");
    stop();
    expectReleased(source);
    expect(() => source.connect()).toThrow("cannot reconnect");
  } finally {
    unsubscribe();
  }
});

test("connection and revocation errors are both retained without a false connection or disposal receipt", () => {
  const source = createClientOwner(buildInitialPayload("primary"));
  const failures: Error[] = [];
  const unsubscribe = source.app.subscribe(() => {
    const error = new Error(`Source observer failure ${failures.length + 1}`);
    failures.push(error);
    throw error;
  });
  let thrown: unknown;
  try {
    source.connect();
  } catch (error) {
    thrown = error;
  } finally {
    unsubscribe();
  }
  expect(thrown).toBeInstanceOf(AggregateError);
  if (!(thrown instanceof AggregateError))
    throw new Error("Missing aggregate failure details");
  expect(failures).toHaveLength(2);
  expect(thrown.errors).toEqual(failures);
  expectReleased(source);
  expect(() => source.connect()).toThrow("cannot reconnect");
});

test("actual public parsing and bootstrap identity validation reject invalid input", () => {
  const initial = buildInitialPayload("primary");
  expect(() =>
    createClientOwner({
      ...initial,
      query: { ...initial.query, pagination: { pageIndex: 0, pageSize: -1 } },
    }),
  ).toThrow("Unsupported public example bootstrap.");
  expect(() =>
    createClientOwner({ ...initial, queryIdentity: "invalid" }),
  ).toThrow("Unsupported public example bootstrap.");
  const query = {
    ...initial.query,
    pagination: { pageIndex: 1, pageSize: 10 },
  };
  expect(() =>
    createClientOwner({
      ...initial,
      query,
      queryIdentity: getQueryIdentity(minimalTransactionSchema, query, {
        now: fixedNow,
      }),
    }),
  ).toThrow("Initial server/client query identity differs.");
});
