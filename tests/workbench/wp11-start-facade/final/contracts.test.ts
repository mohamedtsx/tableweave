import { QueryClient } from "@tanstack/react-query";
import { expect, it } from "vitest";
import {
  bootstrap,
  readInput,
} from "../../../../apps/example-start-facade/src/application/codec.js";
import { createBootstrapSession } from "../../../../apps/example-start-facade/src/application/bootstrap-session.js";
import {
  SourceUnavailable,
  type ReaderPort,
} from "../../../../apps/example-start-facade/src/application/types.js";
const noRead: ReaderPort = {
  bootstrap: async () => {
    throw new SourceUnavailable();
  },
  canary: async () => {
    throw new SourceUnavailable();
  },
  rows: async () => {
    throw new SourceUnavailable();
  },
};
it("Query removal observers see a cleared, closed parent snapshot", () => {
  const client = new QueryClient(),
    session = createBootstrapSession(client, noRead, "client");
  const key = ["wp11-facade-request-canary"] as const;
  client.setQueryData(key, { publicSynthetic: "ungranted-cache-input" });
  let observed = false;
  const stop = client.getQueryCache().subscribe((event) => {
    if (event.type !== "removed") return;
    observed = true;
    expect(session.getSnapshot()).toMatchObject({
      phase: "retiring",
      receipt: null,
      sources: null,
    });
  });
  try {
    expect(session.retire()).toBe(true);
    expect(observed).toBe(true);
  } finally {
    stop();
    session.dispose();
    client.clear();
  }
});
it("failed application remover stays closed as debt until that remover really releases", () => {
  const client = new QueryClient(),
    session = createBootstrapSession(client, noRead, "client");
  let blocked = true;
  session.addRemover(() => {
    if (blocked) throw new Error("Synthetic release blocked");
  });
  expect(session.dispose()).toBe(false);
  expect(session.getSnapshot().phase).toBe("retiring");
  expect(() => session.prepareHydration(null)).toThrow();
  blocked = false;
  expect(session.dispose()).toBe(true);
  expect(session.getSnapshot().phase).toBe("ended");
  client.clear();
});
it("DTOs, scope/clock forgery and access flags do not provide a live hydration lease", () => {
  expect(() =>
    readInput({
      version: 1,
      domain: "transactions",
      scopeKey: "forged",
      hasAccess: true,
    }),
  ).toThrow();
  expect(() =>
    bootstrap({
      id: "not-a-response",
      hasAccess: true,
      transactions: {},
      inventory: {},
    }),
  ).toThrow();
  const client = new QueryClient(),
    session = createBootstrapSession(client, noRead, "client");
  expect(() =>
    session.deserializeData({
      kind: "canary",
      dataset: "alpha",
      bootstrapId: "00000000-0000-0000-0000-000000000000",
      value: "public-canary:alpha:00000000-0000-0000-0000-000000000000",
    }),
  ).toThrow();
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  session.dispose();
  client.clear();
});
it("accessor DTOs are rejected without evaluating getters", () => {
  let evaluated = false;
  const value = Object.defineProperty({}, "id", {
    enumerable: true,
    get() {
      evaluated = true;
      return "unsafe";
    },
  });
  expect(() => bootstrap(value)).toThrow();
  expect(evaluated).toBe(false);
});
it("preload rejection cannot adopt or retire an active application source", async () => {
  const client = new QueryClient(),
    session = createBootstrapSession(client, noRead, "client");
  const before = session.getSnapshot();
  await expect(
    session.load("alpha", new AbortController().signal, true),
  ).rejects.toThrow();
  expect(session.getSnapshot()).toBe(before);
  session.dispose();
  client.clear();
});
