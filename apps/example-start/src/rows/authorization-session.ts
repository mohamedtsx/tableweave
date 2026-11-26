import type { QueryClient } from "@tanstack/react-query";
import type { DemoQuery } from "./schema";
import type { AuthorizationIdentity, Bootstrap } from "./types";

export interface AuthorizationRequest {
  readonly generation: number;
  readonly previousId: number | null;
}
export interface AuthorizedRuntime {
  readonly identity: AuthorizationIdentity;
  readonly terminate: () => void;
  readonly dispose: () => void;
  readonly getQuery: () => DemoQuery;
}
export type AuthorizationCommit = "committed" | "current" | "obsolete";
export class SupersededAuthorizationError extends Error {
  constructor() {
    super("Authorization request was superseded.");
  }
}
const same = (a: AuthorizationIdentity, b: AuthorizationIdentity) =>
  a.id === b.id &&
  a.scopeKey === b.scopeKey &&
  a.definitionKey === b.definitionKey;
export function rowsPrefix(identity: AuthorizationIdentity) {
  return [
    "wp06-rows",
    identity.scopeKey,
    identity.definitionKey,
    identity.id,
  ] as const;
}

/** One application authorization owner per request/browser router, never global. */
export function createAuthorizationSession(client: QueryClient) {
  let sequence = 0;
  let latest: AuthorizationRequest | null = null;
  let current: AuthorizedRuntime | null = null;
  let version = 0;
  const listeners = new Set<() => void>();
  const publish = () => {
    version++;
    for (const listener of listeners) listener();
  };
  const revoked = new Set<number>();
  const prepared = new Map<
    number,
    { identity: AuthorizationIdentity; request: AuthorizationRequest }
  >();
  const isLatest = (request: AuthorizationRequest) => latest === request;
  const isLive = (identity: AuthorizationIdentity) =>
    current !== null &&
    same(current.identity, identity) &&
    !revoked.has(identity.id);
  const canSeed = (identity: AuthorizationIdentity): boolean => {
    if (revoked.has(identity.id)) return false;
    if (isLive(identity)) return true;
    const candidate = prepared.get(identity.id);
    if (
      candidate &&
      latest === candidate.request &&
      same(candidate.identity, identity)
    )
      return true;
    // Initial Start hydration only: the authorized loader data/cache came from SSR.
    return current === null && sequence === 0 && latest === null;
  };
  const retire = (identity: AuthorizationIdentity): boolean => {
    if (!isLive(identity) || !current) return false;
    revoked.add(identity.id);
    current.terminate();
    void client.cancelQueries({ queryKey: rowsPrefix(identity) });
    client.removeQueries({ queryKey: rowsPrefix(identity) });
    return true;
  };
  return {
    // Primitive, request-local snapshots remain stable between owner changes,
    // including SSR/first hydration. They carry no authority or private data.
    getSnapshot: () => version,
    getServerSnapshot: () => version,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hasCurrent: () => current !== null,
    isCurrent: (runtime: AuthorizedRuntime) => current === runtime,
    begin(): AuthorizationRequest {
      prepared.clear();
      const request = Object.freeze({
        generation: ++sequence,
        previousId: current?.identity.id ?? null,
      });
      latest = request;
      publish();
      return request;
    },
    assertLatest(request: AuthorizationRequest) {
      if (!isLatest(request)) throw new SupersededAuthorizationError();
    },
    prepare(
      request: AuthorizationRequest,
      bootstrap: Bootstrap,
    ): AuthorizationIdentity {
      if (!isLatest(request)) throw new SupersededAuthorizationError();
      const old = current?.identity;
      const identity =
        old &&
        !revoked.has(old.id) &&
        old.scopeKey === bootstrap.scopeKey &&
        old.definitionKey === bootstrap.definitionKey
          ? old
          : Object.freeze({
              id: request.generation,
              scopeKey: bootstrap.scopeKey,
              definitionKey: bootstrap.definitionKey,
            });
      prepared.set(identity.id, { identity, request });
      publish();
      return identity;
    },
    deny(request: AuthorizationRequest): boolean {
      // A late prior loader cannot revoke a newer request or committed grant.
      if (
        !isLatest(request) ||
        request.previousId !== (current?.identity.id ?? null)
      )
        return false;
      if (current) retire(current.identity);
      for (const candidate of prepared.values())
        revoked.add(candidate.identity.id);
      prepared.clear();
      latest = null;
      void client.cancelQueries({ queryKey: ["wp06-rows"] });
      client.removeQueries({ queryKey: ["wp06-rows"] });
      void client.cancelQueries({ queryKey: ["request-canary"], exact: true });
      client.removeQueries({ queryKey: ["request-canary"], exact: true });
      publish();
      return true;
    },
    commit(runtime: AuthorizedRuntime): AuthorizationCommit {
      // Recheck at acceptance, not just at construction/render. Expected
      // supersession must not retire the live owner or touch any cache partition.
      if (!canSeed(runtime.identity)) return "obsolete";
      const old = current;
      if (old === runtime) return "current";
      if (
        old &&
        !same(old.identity, runtime.identity) &&
        !revoked.has(old.identity.id)
      )
        retire(old.identity);
      if (old && !same(old.identity, runtime.identity)) old.dispose();
      current = runtime;
      sequence = Math.max(sequence, runtime.identity.id);
      prepared.delete(runtime.identity.id);
      for (const query of client.getQueryCache().getAll()) {
        if (
          query.queryKey[0] === "wp06-rows" &&
          (query.queryKey[1] !== runtime.identity.scopeKey ||
            query.queryKey[2] !== runtime.identity.definitionKey ||
            query.queryKey[3] !== runtime.identity.id)
        ) {
          void client.cancelQueries({ queryKey: query.queryKey, exact: true });
          client.removeQueries({ queryKey: query.queryKey, exact: true });
        }
      }
      publish();
      return "committed";
    },
    queryFor(identity: AuthorizationIdentity): DemoQuery | null {
      return isLive(identity) ? (current?.getQuery() ?? null) : null;
    },
    canSeed,
    isLive,
    revoke(identity: AuthorizationIdentity): boolean {
      if (!retire(identity)) return false;
      publish();
      return true;
    },
  };
}
export type AuthorizationSession = ReturnType<
  typeof createAuthorizationSession
>;
