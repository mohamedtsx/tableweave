// FINAL UNRUN. Real public Query/session/child APIs; no DOM/native-purge proof.
import { QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { createBootstrapSession } from "../../../../apps/example-start-facade/src/application/bootstrap-session.js";
import {
  cachePrefix,
  rowsKey,
} from "../../../../apps/example-start-facade/src/application/query-options.js";
import {
  SourceEnded,
  type ReaderPort,
} from "../../../../apps/example-start-facade/src/application/types.js";
import { syntheticReader } from "./synthetic-reader.js";
const canaryKey = ["wp11-facade-request-canary"] as const;
async function mountedSource() {
  const client = new QueryClient(),
    reader = syntheticReader();
  const session = createBootstrapSession(client, reader, "client");
  const boot = await session.load("alpha", new AbortController().signal, false);
  const detach = session.attach(boot),
    sources = session.getSnapshot().sources;
  if (!sources) throw new Error("Missing genuine committed-attachment sources");
  await vi.waitFor(() => {
    expect(sources.transactions.resource.getSnapshot().snapshot).not.toBeNull();
    expect(sources.inventory.resource.getSnapshot().snapshot).not.toBeNull();
  });
  return {
    client,
    reader,
    session,
    boot,
    sources,
    close() {
      detach();
      session.dispose();
      client.clear();
    },
  };
}
it("stages cleared parent before real child P/resource/C/draft callbacks; parent listeners run last", async () => {
  const value = await mountedSource(),
    { session, sources } = value;
  const events: string[] = [],
    stops: (() => void)[] = [];
  function childEvent(name: string) {
    expect(session.getSnapshot()).toMatchObject({
      phase: "retiring",
      receipt: null,
      sources: null,
    });
    expect(session.serialize()).toEqual({ bootstrap: null });
    events.push(name);
  }
  try {
    for (const [name, source] of Object.entries(sources)) {
      const id = name === "transactions" ? "alpha:tx-001" : "alpha:it-001";
      source.C.dispatch({ type: "selection.change", update: { [id]: true } });
      source.C.dispatch({ type: "details.change", update: { rowId: id } });
      stops.push(source.P.subscribe(() => childEvent(`${name}:P`)));
      stops.push(source.C.subscribe(() => childEvent(`${name}:C`)));
      stops.push(
        source.resource.subscribe(() => childEvent(`${name}:resource`)),
      );
      source.registerDraft(() => childEvent(`${name}:draft`));
    }
    stops.push(
      session.subscribe(() => {
        events.push("parent");
        expect(session.getSnapshot()).toMatchObject({
          receipt: null,
          sources: null,
        });
      }),
    );
    expect(session.retire()).toBe(true);
    for (const domain of ["transactions", "inventory"])
      for (const part of ["P", "C", "resource", "draft"])
        expect(events).toContain(`${domain}:${part}`);
    expect(events.at(-1)).toBe("parent");
    expect(events.filter((event) => event === "parent")).toHaveLength(1);
    for (const source of Object.values(sources)) {
      expect(source.isCurrent()).toBe(false);
      expect(source.resource.getSnapshot().snapshot).toBeNull();
      expect(source.C.getSnapshot().details.rowId).toBeNull();
      expect(
        Object.values(source.C.getSnapshot().selection).some(Boolean),
      ).toBe(false);
    }
  } finally {
    for (const stop of stops) stop();
    value.close();
  }
});
it("retains exact old partition after public receipt is null, attempts second domain/canary and blocks new owners", async () => {
  const value = await mountedSource(),
    { client, reader, session, boot } = value;
  const key = rowsKey(boot.transactions),
    cached = client.getQueryData(key);
  let blocked = true,
    inventoryAttempted = false,
    canaryAttempted = false,
    reentrant = false;
  const rejected: Promise<unknown>[] = [];
  const stop = client.getQueryCache().subscribe((event) => {
    if (event.type !== "removed") return;
    expect(session.getSnapshot()).toMatchObject({
      phase: "retiring",
      receipt: null,
      sources: null,
    });
    if (event.query.queryKey[0] === canaryKey[0]) canaryAttempted = true;
    if (event.query.queryKey[2] === "inventory") inventoryAttempted = true;
    if (blocked && event.query.queryKey[2] === "transactions") {
      client.setQueryData(key, cached); // Real reentrant cache residue, not a fake removal counter.
      reentrant = session.retire() === false;
      rejected.push(
        session
          .load("beta", new AbortController().signal, false)
          .catch((error: unknown) => error),
      );
      throw new Error(
        "Synthetic removal observer failed after reinserting old entry",
      );
    }
  });
  try {
    expect(session.retire()).toBe(false);
    expect(reentrant && inventoryAttempted && canaryAttempted).toBe(true);
    expect(session.getSnapshot()).toMatchObject({
      phase: "retiring",
      receipt: null,
      sources: null,
    });
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(boot.id) }),
    ).toHaveLength(1);
    expect(
      client.getQueryCache().findAll({ queryKey: canaryKey, exact: true }),
    ).toHaveLength(0);
    const calls = reader.bootstrapCalls;
    await expect(
      session.load("beta", new AbortController().signal, false),
    ).rejects.toBeInstanceOf(SourceEnded);
    expect(() => session.attach(boot)).toThrow(SourceEnded);
    expect(() => session.prepareHydration(boot)).toThrow(SourceEnded);
    const closedBeforeAdoption = session.getSnapshot();
    expect(session.adoptHydration()).toBeUndefined();
    expect(session.getSnapshot()).toBe(closedBeforeAdoption);
    expect(closedBeforeAdoption).toMatchObject({
      phase: "retiring",
      receipt: null,
      sources: null,
    });
    expect(() => session.deserializeData(cached)).toThrow(SourceEnded);
    expect(reader.bootstrapCalls).toBe(calls);
    expect(
      (await Promise.all(rejected)).every(
        (error) => error instanceof SourceEnded,
      ),
    ).toBe(true);
    blocked = false;
    expect(session.retire()).toBe(true);
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(boot.id) }),
    ).toHaveLength(0);
    expect(
      client.getQueryCache().findAll({ queryKey: canaryKey, exact: true }),
    ).toHaveLength(0);
    const newer = await session.load(
      "beta",
      new AbortController().signal,
      false,
    );
    session.attach(newer);
    expect(newer.id).not.toBe(boot.id);
    expect(session.getSnapshot().sources?.inventory.isCurrent()).toBe(true);
    expect(() => session.attach(boot)).toThrow(SourceEnded);
    expect(session.getSnapshot().receipt).toBe(newer);
  } finally {
    blocked = false;
    stop();
    value.close();
  }
});
it("later canary callback cannot hide reinserted earlier partition even without throwing", async () => {
  const value = await mountedSource(),
    { client, session, boot } = value;
  const key = rowsKey(boot.transactions),
    cached = client.getQueryData(key);
  let reinsert = true;
  const stop = client.getQueryCache().subscribe((event) => {
    if (
      reinsert &&
      event.type === "removed" &&
      event.query.queryKey[0] === canaryKey[0]
    )
      client.setQueryData(key, cached);
  });
  try {
    expect(session.retire()).toBe(false);
    expect(session.getSnapshot().receipt).toBeNull();
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(boot.id) }),
    ).toHaveLength(1);
    reinsert = false;
    expect(session.retire()).toBe(true);
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(boot.id) }),
    ).toHaveLength(0);
  } finally {
    reinsert = false;
    stop();
    value.close();
  }
});
it("real child P disposal debt never forces C disposal; independent cache/remover cleanup is attempted", async () => {
  const value = await mountedSource(),
    { client, session, sources, boot } = value;
  let blocked = true,
    removed = false;
  sources.transactions.C.dispatch({
    type: "selection.change",
    update: { "alpha:tx-001": true },
  });
  sources.transactions.registerDraft(() => {
    if (blocked) throw new Error("Synthetic real P retirement blocked");
  });
  session.addRemover(() => {
    removed = true;
  });
  try {
    expect(session.dispose()).toBe(false);
    expect(removed).toBe(true);
    expect(session.getSnapshot()).toMatchObject({
      phase: "retiring",
      receipt: null,
      sources: null,
    });
    expect(sources.transactions.C.getSnapshot().selection["alpha:tx-001"]).toBe(
      true,
    );
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(boot.id) }),
    ).toHaveLength(0);
    expect(
      client.getQueryCache().findAll({ queryKey: canaryKey, exact: true }),
    ).toHaveLength(0);
    blocked = false;
    expect(session.dispose()).toBe(true);
    expect(
      Object.values(sources.transactions.C.getSnapshot().selection).some(
        Boolean,
      ),
    ).toBe(false);
  } finally {
    blocked = false;
    value.close();
  }
});
it("remover failures and post-removal old-key insertion retain obligations until a clean actual retry", async () => {
  const value = await mountedSource(),
    { client, session, boot } = value;
  const key = rowsKey(boot.inventory),
    cached = client.getQueryData(key);
  let blocked = true,
    calls = 0;
  session.addRemover(() => {
    calls++;
    if (blocked) {
      client.setQueryData(key, cached);
      throw new Error("Synthetic remover debt");
    }
  });
  try {
    expect(session.dispose()).toBe(false);
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(boot.id) }),
    ).toHaveLength(1);
    expect(session.getSnapshot()).toMatchObject({
      phase: "retiring",
      receipt: null,
      sources: null,
    });
    blocked = false;
    expect(session.dispose()).toBe(true);
    expect(calls).toBe(2);
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(boot.id) }),
    ).toHaveLength(0);
    expect(session.getSnapshot().phase).toBe("ended");
  } finally {
    blocked = false;
    value.close();
  }
});
it("synchronously throwing cancellation observer does not prevent independent old-entry removal", async () => {
  const value = await mountedSource(),
    { client, session, boot } = value;
  let resolve: (value: string) => void = () => {
    throw new Error("Not initialized");
  };
  const pending = new Promise<string>((done) => {
    resolve = done;
  });
  const task = client
    .query({
      queryKey: [...cachePrefix(boot.id), "pending-cancellation"],
      retry: false,
      queryFn: () => pending,
    })
    .catch((error: unknown) => error);
  let blocked = true,
    sawCancellation = false;
  const stop = client.getQueryCache().subscribe((event) => {
    if (
      blocked &&
      event.type === "updated" &&
      event.query.queryKey[2] === "pending-cancellation" &&
      event.query.state.fetchStatus === "idle"
    ) {
      sawCancellation = true;
      throw new Error("Synthetic cancellation observer failed");
    }
  });
  try {
    expect(session.retire()).toBe(false);
    expect(sawCancellation).toBe(true);
    expect(session.getSnapshot().phase).toBe("retiring");
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(boot.id) }),
    ).toHaveLength(0);
    expect(
      client.getQueryCache().findAll({ queryKey: canaryKey, exact: true }),
    ).toHaveLength(0);
    blocked = false;
    expect(session.retire()).toBe(true);
  } finally {
    blocked = false;
    stop();
    resolve("late synthetic result");
    await task;
    value.close();
  }
});
it("late old bootstrap denial/abort cannot retire a newer genuine owner", async () => {
  const client = new QueryClient(),
    memory = syntheticReader();
  let release: (value: unknown) => void = () => {
    throw new Error("Not initialized");
  };
  const held = new Promise<unknown>((resolve) => {
    release = resolve;
  });
  let first = true;
  const reader: ReaderPort = {
    ...memory,
    bootstrap(selected, signal) {
      if (first) {
        first = false;
        return held;
      }
      return memory.bootstrap(selected, signal);
    },
  };
  const session = createBootstrapSession(client, reader, "client"),
    oldAbort = new AbortController();
  const old = session
    .load("alpha", oldAbort.signal, false)
    .catch((error: unknown) => error);
  try {
    const newer = await session.load(
      "beta",
      new AbortController().signal,
      false,
    );
    session.attach(newer);
    const sources = session.getSnapshot().sources;
    release({ kind: "denied" });
    oldAbort.abort();
    expect(await old).toBeInstanceOf(Error);
    expect(session.getSnapshot()).toMatchObject({
      phase: "adopted",
      receipt: newer,
      sources,
    });
    expect(sources?.transactions.isCurrent()).toBe(true);
    expect(sources?.inventory.isCurrent()).toBe(true);
    expect(
      client.getQueryCache().findAll({ queryKey: cachePrefix(newer.id) }),
    ).toHaveLength(2);
  } finally {
    release({ kind: "denied" });
    await old;
    session.dispose();
    client.clear();
  }
});
