import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type AuthorizedRuntime,
  createAuthorizationSession,
  rowsPrefix,
  SupersededAuthorizationError,
} from "../../apps/example-start/src/rows/authorization-session";
import { createDemoRuntime } from "../../apps/example-start/src/rows/runtime";
import {
  alternateDefinitionKey,
  type DemoQuery,
  definitionKey,
  fixtureClock,
  initialQuery,
} from "../../apps/example-start/src/rows/schema";
import type {
  AuthorizationIdentity,
  Bootstrap,
} from "../../apps/example-start/src/rows/types";

// Negative construction uses the real runtime/native factories, not a positive
// mocked grant. No Start RPC should be imported or invoked by an obsolete seed.
vi.mock("../../apps/example-start/src/rows/transport", () => ({
  loadRows: () => {
    throw new Error("Obsolete runtime construction attempted transport.");
  },
}));

const clients: QueryClient[] = [];
function clientForTest() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  return client;
}
afterEach(() => {
  for (const client of clients) client.clear();
  clients.length = 0;
  vi.restoreAllMocks();
});
function bootstrap(
  scopeKey = "demo:alpha",
  definition = definitionKey,
): Bootstrap {
  return {
    scopeKey,
    definitionKey: definition,
    tableId: "wp06-supersession-unit",
    clock: fixtureClock,
    query: initialQuery(),
  };
}
function runtime(identity: AuthorizationIdentity, query = initialQuery()) {
  // Synthetic app-owner lifecycle counters/state ONLY: not native controller,
  // backend authorization, browser scheduling or production authentication proof.
  const state = {
    query,
    selected: new Set(["synthetic-selected-id"]),
    access: true,
    terminations: 0,
    disposals: 0,
  };
  const authority: AuthorizedRuntime = {
    identity,
    getQuery: () => state.query,
    terminate() {
      state.terminations++;
      state.access = false;
      state.selected.clear();
    },
    dispose() {
      state.disposals++;
    },
  };
  return { authority, state };
}
function cacheKey(identity: AuthorizationIdentity) {
  return [...rowsPrefix(identity), "synthetic-owner-unit-query"] as const;
}

describe("synthetic app-owner supersession (real QueryClient)", () => {
  for (const [variant, scope, definition] of [
    ["scope", "demo:beta", definitionKey],
    ["definition", "demo:alpha", alternateDefinitionKey],
  ] as const) {
    it(`drops completed ${variant} B after begin C without throwing, purging or retiring A`, () => {
      const client = clientForTest();
      const owner = createAuthorizationSession(client);
      const requestA = owner.begin();
      const a = runtime(owner.prepare(requestA, bootstrap()));
      expect(owner.commit(a.authority)).toBe("committed");
      const dataA = { marker: "synthetic-cache-A" };
      client.setQueryData(cacheKey(a.authority.identity), dataA);

      const requestB = owner.begin();
      const b = runtime(owner.prepare(requestB, bootstrap(scope, definition)));
      expect(owner.canSeed(b.authority.identity)).toBe(true);
      const dataB = { marker: "synthetic-cache-B" };
      client.setQueryData(cacheKey(b.authority.identity), dataB);
      const requestC = owner.begin();
      const cachedBefore = client.getQueryCache().getAll();
      const versionBefore = owner.getSnapshot();
      const notified = vi.fn();
      const unsubscribe = owner.subscribe(notified);
      const cancel = vi.spyOn(client, "cancelQueries");
      const remove = vi.spyOn(client, "removeQueries");

      expect(owner.canSeed(b.authority.identity)).toBe(false);
      expect(owner.commit(b.authority)).toBe("obsolete");
      expect(owner.getSnapshot()).toBe(versionBefore);
      expect(notified).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      expect(client.getQueryCache().getAll()).toEqual(cachedBefore);
      expect(client.getQueryData(cacheKey(a.authority.identity))).toBe(dataA);
      expect(client.getQueryData(cacheKey(b.authority.identity))).toBe(dataB);
      expect(owner.isCurrent(a.authority)).toBe(true);
      expect(owner.isLive(a.authority.identity)).toBe(true);
      expect(owner.isLive(b.authority.identity)).toBe(false);
      expect(a.state).toMatchObject({
        access: true,
        terminations: 0,
        disposals: 0,
      });
      expect(a.state.selected.size).toBe(1);
      expect(b.state.terminations).toBe(0);
      expect(b.state.disposals).toBe(0);

      const c = runtime(
        owner.prepare(requestC, bootstrap("demo:beta", alternateDefinitionKey)),
      );
      const dataC = { marker: "synthetic-cache-C" };
      client.setQueryData(cacheKey(c.authority.identity), dataC);
      expect(owner.commit(c.authority)).toBe("committed");
      expect(owner.commit(c.authority)).toBe("current");
      expect(owner.commit(b.authority)).toBe("obsolete");
      expect(owner.commit(a.authority)).toBe("obsolete");
      expect(owner.deny(requestB)).toBe(false);
      expect(owner.isCurrent(c.authority)).toBe(true);
      expect(a.state).toMatchObject({
        access: false,
        terminations: 1,
        disposals: 1,
      });
      expect(a.state.selected.size).toBe(0);
      expect(c.state.terminations).toBe(0);
      expect(c.state.disposals).toBe(0);
      expect(
        client.getQueryData(cacheKey(a.authority.identity)),
      ).toBeUndefined();
      expect(
        client.getQueryData(cacheKey(b.authority.identity)),
      ).toBeUndefined();
      expect(client.getQueryData(cacheKey(c.authority.identity))).toBe(dataC);
      unsubscribe();
    });

    it(`does not construct/seed an obsolete ${variant} runtime or fall back to the live A grant`, () => {
      const client = clientForTest();
      const owner = createAuthorizationSession(client);
      const requestA = owner.begin();
      const a = runtime(owner.prepare(requestA, bootstrap()));
      owner.commit(a.authority);
      const requestB = owner.begin();
      const source = bootstrap(scope, definition);
      const grantB = owner.prepare(requestB, source);
      const obsolete = { ...source, authorizationId: grantB.id };
      const dataA = { marker: "synthetic-live-cache" };
      client.setQueryData(cacheKey(a.authority.identity), dataA);
      owner.begin();
      const cachedBefore = client.getQueryCache().getAll();
      const versionBefore = owner.getSnapshot();

      // In particular this must not reach the missing-bootstrap-cache exception.
      expect(createDemoRuntime(obsolete, client, owner)).toBeNull();
      expect(owner.getSnapshot()).toBe(versionBefore);
      expect(client.getQueryCache().getAll()).toEqual(cachedBefore);
      expect(client.getQueryData(cacheKey(a.authority.identity))).toBe(dataA);
      expect(owner.isCurrent(a.authority)).toBe(true);
      expect(owner.canSeed(grantB)).toBe(false);
      expect(a.state.terminations).toBe(0);
      expect(a.state.disposals).toBe(0);
    });
  }

  it("keeps the exact current owner/page/selection across same-identity revalidation and latest-request guards", () => {
    const client = clientForTest();
    const owner = createAuthorizationSession(client);
    const requestA = owner.begin();
    const initial = initialQuery();
    const pageTwo: DemoQuery = {
      ...initial,
      pagination: { ...initial.pagination, pageIndex: 1 },
    };
    const a = runtime(owner.prepare(requestA, bootstrap()), pageTwo);
    owner.commit(a.authority);
    const dataA = { marker: "synthetic-current-page-two" };
    client.setQueryData(cacheKey(a.authority.identity), dataA);
    const requestB = owner.begin();
    expect(owner.prepare(requestB, bootstrap())).toBe(a.authority.identity);
    expect(owner.queryFor(a.authority.identity)).toBe(pageTwo);
    expect(owner.commit(a.authority)).toBe("current");
    const requestC = owner.begin();
    expect(() => owner.assertLatest(requestB)).toThrow(
      SupersededAuthorizationError,
    );
    expect(() => owner.prepare(requestB, bootstrap())).toThrow(
      SupersededAuthorizationError,
    );
    expect(owner.deny(requestB)).toBe(false);
    expect(owner.canSeed(a.authority.identity)).toBe(true);
    expect(owner.commit(a.authority)).toBe("current");
    expect(owner.prepare(requestC, bootstrap())).toBe(a.authority.identity);
    expect(owner.commit(a.authority)).toBe("current");
    expect(owner.isCurrent(a.authority)).toBe(true);
    expect(owner.queryFor(a.authority.identity)).toBe(pageTwo);
    expect(a.state.selected.size).toBe(1);
    expect(a.state.terminations).toBe(0);
    expect(a.state.disposals).toBe(0);
    expect(client.getQueryData(cacheKey(a.authority.identity))).toBe(dataA);
  });

  it("keeps denial terminal across same-label ABA, old-grant recommit attempts and delayed denial", () => {
    const client = clientForTest();
    const owner = createAuthorizationSession(client);
    const requestA = owner.begin();
    const a = runtime(owner.prepare(requestA, bootstrap()));
    owner.commit(a.authority);
    const requestB = owner.begin();
    const b = runtime(owner.prepare(requestB, bootstrap("demo:beta")));
    client.setQueryData(cacheKey(a.authority.identity), { marker: "A" });
    client.setQueryData(cacheKey(b.authority.identity), { marker: "B" });
    client.setQueryData(["request-canary"], { marker: "synthetic-canary" });

    // This call represents the app handling a genuine latest backend denial;
    // these structural units do not themselves prove backend authentication.
    expect(owner.deny(requestB)).toBe(true);
    expect(owner.canSeed(a.authority.identity)).toBe(false);
    expect(owner.canSeed(b.authority.identity)).toBe(false);
    expect(owner.queryFor(a.authority.identity)).toBeNull();
    expect(owner.commit(a.authority)).toBe("obsolete");
    expect(owner.commit(b.authority)).toBe("obsolete");
    expect(
      createDemoRuntime(
        { ...bootstrap(), authorizationId: a.authority.identity.id },
        client,
        owner,
      ),
    ).toBeNull();
    expect(owner.revoke(a.authority.identity)).toBe(false);
    expect(a.state.terminations).toBe(1);
    expect(client.getQueryCache().getAll()).toEqual([]);

    const requestC = owner.begin();
    const c = runtime(owner.prepare(requestC, bootstrap()));
    expect(c.authority.identity.id).not.toBe(a.authority.identity.id);
    expect(owner.commit(c.authority)).toBe("committed");
    expect(owner.commit(c.authority)).toBe("current");
    expect(owner.deny(requestB)).toBe(false);
    expect(owner.revoke(a.authority.identity)).toBe(false);
    expect(owner.commit(a.authority)).toBe("obsolete");
    expect(owner.canSeed(a.authority.identity)).toBe(false);
    expect(owner.isLive(c.authority.identity)).toBe(true);
    expect(a.state.terminations).toBe(1);
    expect(a.state.disposals).toBe(1);
    expect(c.state.terminations).toBe(0);
    expect(c.state.disposals).toBe(0);
  });

  it("publishes stable version-only snapshots and accepts the initial SSR grant only once", () => {
    const client = clientForTest();
    const owner = createAuthorizationSession(client);
    const initialVersion = owner.getServerSnapshot();
    expect(owner.hasCurrent()).toBe(false);
    expect(owner.getServerSnapshot()).toBe(initialVersion);
    expect(owner.getSnapshot()).toBe(initialVersion);
    const notified = vi.fn();
    const unsubscribe = owner.subscribe(notified);
    // Browser hydration starts with the request-authorized SSR bootstrap/cache,
    // not another begin/prepare or a new synthetic identity from current labels.
    const a = runtime({
      id: 7,
      scopeKey: "demo:alpha",
      definitionKey,
    });
    expect(owner.canSeed(a.authority.identity)).toBe(true);
    expect(owner.commit(a.authority)).toBe("committed");
    expect(owner.hasCurrent()).toBe(true);
    expect(owner.getSnapshot()).toBeGreaterThan(initialVersion);
    expect(owner.getServerSnapshot()).toBe(owner.getSnapshot());
    const acceptedVersion = owner.getSnapshot();
    expect(owner.commit(a.authority)).toBe("current");
    expect(owner.getSnapshot()).toBe(acceptedVersion);
    expect(notified).toHaveBeenCalledTimes(1);
    const next = owner.begin();
    expect(next.generation).toBeGreaterThan(a.authority.identity.id);
    expect(notified).toHaveBeenCalledTimes(2);
    expect(owner.isLive(a.authority.identity)).toBe(true);
    unsubscribe();
    owner.prepare(next, bootstrap());
    expect(notified).toHaveBeenCalledTimes(2);
  });
});
