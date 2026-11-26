import { expect, test } from "vitest";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import ClientDataTableBoundary from "../../../apps/example-next/app/ClientDataTableBoundary.js";
import { createClientOwner } from "../../../apps/example-next/lib/client-owner.js";
import { buildInitialPayload } from "../../../apps/example-next/lib/server-contract.js";

test("genuine useDataTable SSR is a neutral status, not fabricated native rows or hydration proof", () => {
  const html = renderToString(
    <StrictMode>
      <ClientDataTableBoundary initial={buildInitialPayload("primary")} />
    </StrictMode>,
  );
  expect(html).toContain('role="status"');
  expect(html).not.toContain("<table");
  expect(html).not.toContain("Transfer note 01");
});
test("two genuine A source owners retain separate controllers and exact initial query", async () => {
  const a = createClientOwner(buildInitialPayload("primary")),
    b = createClientOwner(buildInitialPayload("comparison"));
  const stopA = a.connect(),
    stopB = b.connect();
  try {
    expect(a.app.C).not.toBe(b.app.C);
    expect(a.app.P).not.toBe(b.app.P);
    expect(a.app.C.getSnapshot().queryIdentity).toBe(a.initial.queryIdentity);
    a.app.dispatch({
      type: "pagination.change",
      update: { pageIndex: 1, pageSize: 10 },
    });
    expect(a.app.C.getSnapshot().query.pagination.pageIndex).toBe(1);
    expect(b.app.C.getSnapshot().query.pagination.pageIndex).toBe(0);
    a.app.revoke();
    expect(a.app.getSnapshot().access).toBe(false);
    expect(b.app.getSnapshot().access).toBe(true);
  } finally {
    stopA();
    stopB();
    await Promise.resolve();
  }
  expect(a.app.C.isDisposed()).toBe(true);
  expect(b.app.C.isDisposed()).toBe(true);
});
test("immediate Strict-style source effect replay uses the same C/P, then terminal disposal", async () => {
  const source = createClientOwner(buildInitialPayload("primary")),
    C = source.app.C,
    P = source.app.P;
  source.connect()();
  const stop = source.connect();
  await Promise.resolve();
  expect(source.app.C).toBe(C);
  expect(source.app.P).toBe(P);
  expect(C.isDisposed()).toBe(false);
  stop();
  await Promise.resolve();
  expect(C.isDisposed()).toBe(true);
  expect(() => source.connect()).toThrow();
});
test("actual public query parsing rejects an invalid bootstrap before constructing an owner", () => {
  const initial = buildInitialPayload("primary");
  expect(() =>
    createClientOwner({
      ...initial,
      query: { ...initial.query, pagination: { pageIndex: 0, pageSize: -1 } },
    }),
  ).toThrow("Unsupported public example bootstrap.");
});
