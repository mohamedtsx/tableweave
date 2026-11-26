import {
  createNativeController,
  createResourceAdapter,
  defineNativeTable,
  projectResourceView,
  type ResourceAdapter,
  type ResourceRequest,
  type ResourceView,
  type TableCommand,
} from "@tableweave/react";
import type { QueryClient } from "@tanstack/react-query";
import { AuthorizationLostError } from "./authorization";
import { type AuthorizationSession, rowsPrefix } from "./authorization-session";
import { rowsOptions } from "./options";
import {
  alternateDefinitionKey,
  type DemoQuery,
  definitionKey,
  identity,
  schema,
} from "./schema";
import type {
  AuthorizedBootstrap,
  Canary,
  ReadInput,
  ReadMode,
  RecordRow,
  RowsResult,
} from "./types";

function makeDefinition(alternate: boolean) {
  return defineNativeTable<typeof schema, RecordRow>({
    schema,
    selection: true,
    details: true,
    multiSort: true,
    getRowId: (row) => row.id,
    columns: [
      {
        id: "label",
        header: "Record",
        accessorKey: "label",
        enableHiding: false,
        meta: { rowHeader: true },
      },
      {
        id: "amount",
        header: alternate ? "Amount (alternate layout)" : "Amount",
        accessorKey: "amount",
      },
      { id: "status", header: "Status", accessorKey: "status" },
    ],
  });
}
const definitions = new Map([
  [definitionKey, makeDefinition(false)],
  [alternateDefinitionKey, makeDefinition(true)],
]);

/** App/request-owned composition, NOT a new Tableweave fetch/SSR API. */
export function createDemoRuntime(
  bootstrap: AuthorizedBootstrap,
  client: QueryClient,
  authorization: AuthorizationSession,
) {
  const grant = {
    id: bootstrap.authorizationId,
    scopeKey: bootstrap.scopeKey,
    definitionKey: bootstrap.definitionKey,
  };
  // A returned bootstrap can become obsolete while React is suspended. This is
  // not a backend denial and must allocate/seed nothing, nor crash the route.
  if (!authorization.canSeed(grant)) return null;
  const nativeDefinition = definitions.get(bootstrap.definitionKey);
  if (!nativeDefinition) throw new Error("Unknown application definition.");
  const context = {
    definitionKey: bootstrap.definitionKey,
    scopeKey: bootstrap.scopeKey,
    access: true,
  };
  let nextMode: ReadMode = "normal";
  let retryMode: ReadMode = "normal";
  let currentInput: ReadInput = {
    scopeKey: bootstrap.scopeKey,
    clock: bootstrap.clock,
    query: bootstrap.query,
    requestKey: "rows-v1",
    mode: "normal",
  };
  let correctionCount = 0;
  const optionLabels = new Map<string, string>();
  let serverView: ResourceView<RecordRow, DemoQuery> | undefined;
  const raw = createResourceAdapter<RecordRow, DemoQuery>(context, {
    onInvalidate(event) {
      serverView = raw.getSnapshot();
      optionLabels.clear();
      if (!controller.isDisposed()) {
        controller.dispatch({ type: "selection.cancel" });
        controller.dispatch({
          type: "details.change",
          update: { rowId: null },
        });
      }
      void client.cancelQueries({
        queryKey: rowsPrefix(grant),
      });
      if (event.reason !== "unmount")
        client.removeQueries({ queryKey: rowsPrefix(grant) });
      if (
        event.reason !== "unmount" &&
        client.getQueryData<Canary & { readonly authorizationId: number }>([
          "request-canary",
        ])?.authorizationId === grant.id
      ) {
        void client.cancelQueries({
          queryKey: ["request-canary"],
          exact: true,
        });
        client.removeQueries({ queryKey: ["request-canary"], exact: true });
      }
    },
  });
  const controller = createNativeController(nativeDefinition, {
    initial: { query: bootstrap.query },
    now: () => bootstrap.clock,
    onQueryChange(query) {
      // Synchronous intent tagging: obsolete rows are guarded BEFORE transport.
      const mode = nextMode;
      nextMode = "normal";
      currentInput = input(query, "rows-v1", mode);
      const token = begin(query);
      if (token) void execute(token, mode);
    },
  });
  function input(
    query: DemoQuery,
    requestKey: string,
    mode: ReadMode,
  ): ReadInput {
    return {
      scopeKey: bootstrap.scopeKey,
      clock: bootstrap.clock,
      query,
      requestKey,
      mode,
    };
  }
  function begin(
    query: DemoQuery,
    requestKey = "rows-v1",
  ): ResourceRequest<DemoQuery> | null {
    if (!authorization.isLive(grant)) return null;
    return raw.begin({
      ...context,
      query,
      queryKey: identity(query, bootstrap.clock),
      requestKey,
      retry: (token) => {
        const mode = retryMode;
        retryMode = "normal";
        return execute(token, mode);
      },
    });
  }
  function promote(
    token: ResourceRequest<DemoQuery>,
    result: RowsResult,
  ): boolean {
    if (
      result.source !== "fresh" ||
      result.scopeKey !== token.scopeKey ||
      result.queryKey !== token.queryKey ||
      result.requestKey !== token.requestKey
    )
      return false;
    return raw.succeed(token, result);
  }
  async function execute(
    token: ResourceRequest<DemoQuery>,
    mode: ReadMode,
  ): Promise<void> {
    const options = rowsOptions(
      input(token.query, token.requestKey, mode),
      grant,
    );
    currentInput = input(token.query, token.requestKey, mode);
    // Cancel the previous same-key generation, including an uncancellable reader.
    void client.cancelQueries({ queryKey: rowsPrefix(grant) });
    if (
      raw.getSnapshot().request !== token ||
      !raw.getSnapshot().context.access ||
      !authorization.isLive(grant)
    )
      return;
    try {
      const result = await client.query({ ...options, staleTime: 0 });
      if (
        raw.getSnapshot().request !== token ||
        raw.getSnapshot().kind !== "pending" ||
        !authorization.isLive(grant)
      )
        return;
      if (
        result.correctedPage !== null &&
        result.page.kind === "known" &&
        correctionCount < 1
      ) {
        // Even an out-of-range successful empty response replaces older rows.
        if (!promote(token, result)) return;
        correctionCount++;
        nextMode = mode;
        controller.dispatch({
          type: "pagination.clamp",
          pageCount: Math.ceil(
            result.page.total / token.query.pagination.pageSize,
          ),
          queryIdentity: token.queryKey,
        });
        return;
      }
      if (result.correctedPage !== null) raw.fail(token, "unavailable");
      else promote(token, result);
    } catch (error) {
      if (
        raw.getSnapshot().request !== token ||
        raw.getSnapshot().kind !== "pending"
      )
        return;
      if (error instanceof AuthorizationLostError) authorization.revoke(grant);
      else raw.fail(token, "unavailable");
    }
  }
  function resume(): void {
    if (
      !authorization.isLive(grant) ||
      !raw.getSnapshot().context.access ||
      !raw.getSnapshot().active
    )
      return;
    const query = controller.getSnapshot().query;
    const key = rowsOptions(input(query, "rows-v1", "normal"), grant).queryKey;
    const cached = client.getQueryData<RowsResult>(key);
    const cachedState = client.getQueryState(key);
    if (
      cached &&
      cachedState?.status === "success" &&
      !cachedState.isInvalidated &&
      Date.now() - cachedState.dataUpdatedAt < 30_000 &&
      cached.scopeKey === context.scopeKey &&
      cached.queryKey === identity(query, bootstrap.clock)
    ) {
      const token = begin(query, cached.requestKey);
      if (token) promote(token, cached);
    } else {
      const token = begin(query);
      if (token) void execute(token, "normal");
    }
  }
  // Only an authorized matching fresh cache response can seed this factory.
  const seedKey = rowsOptions(
    input(bootstrap.query, "rows-v1", "normal"),
    grant,
  ).queryKey;
  const seed = client.getQueryData<RowsResult>(seedKey);
  if (
    !seed ||
    seed.scopeKey !== bootstrap.scopeKey ||
    seed.queryKey !== identity(bootstrap.query, bootstrap.clock)
  )
    throw new Error("Missing authorized bootstrap.");
  const seedToken = raw.begin({
    ...context,
    query: bootstrap.query,
    queryKey: identity(bootstrap.query, bootstrap.clock),
    requestKey: seed.requestKey,
  });
  if (!seedToken || !promote(seedToken, seed))
    throw new Error("Invalid authorized bootstrap.");
  serverView = raw.getSnapshot();
  let projectedClient:
    | {
        source: ResourceView<RecordRow, DemoQuery>;
        view: ResourceView<RecordRow, DemoQuery>;
      }
    | undefined;
  let projectedServer: typeof projectedClient;
  const guarded = (
    source: ResourceView<RecordRow, DemoQuery>,
    server = false,
  ) => {
    if (authorization.canSeed(grant)) return source;
    const previous = server ? projectedServer : projectedClient;
    if (previous?.source === source) return previous.view;
    const next = {
      source,
      view: projectResourceView(source, { ...context, access: false }),
    };
    if (server) projectedServer = next;
    else projectedClient = next;
    return next.view;
  };
  const resource: ResourceAdapter<RecordRow, DemoQuery> = {
    ...raw,
    subscribe(listener) {
      const disconnectResource = raw.subscribe(listener);
      const disconnectAuthorization = authorization.subscribe(listener);
      return () => {
        disconnectResource();
        disconnectAuthorization();
      };
    },
    getSnapshot: () => guarded(raw.getSnapshot()),
    getServerSnapshot: () =>
      guarded(serverView ?? raw.getServerSnapshot(), true),
    begin: (input) => (authorization.isLive(grant) ? raw.begin(input) : null),
    succeed: (token, result) =>
      authorization.isLive(grant) && raw.succeed(token, result),
    fail: (token, code) => {
      if (
        !authorization.isLive(grant) ||
        raw.getSnapshot().request !== token ||
        raw.getSnapshot().kind !== "pending"
      )
        return false;
      return code === "access-lost"
        ? authorization.revoke(grant)
        : raw.fail(token, code);
    },
    retry: () => (authorization.isLive(grant) ? raw.retry() : null),
    setContext(next) {
      // Identity/restoration needs a fresh authorized keyed session, never an
      // old allowed prop or a context write into this fixed-grant wrapper.
      if (
        next.scopeKey !== grant.scopeKey ||
        next.definitionKey !== grant.definitionKey
      )
        return;
      if (!next.access) authorization.revoke(grant);
      raw.setContext({
        ...context,
        access:
          next.access &&
          authorization.canSeed(grant) &&
          raw.getSnapshot().context.access,
      });
    },
    connect() {
      if (!authorization.isLive(grant)) {
        if (!authorization.canSeed(grant))
          raw.setContext({ ...context, access: false });
        return () => {};
      }
      const disconnect = raw.connect();
      if (raw.getSnapshot().snapshot === null) resume();
      return disconnect;
    },
  };
  return {
    definition: nativeDefinition,
    authority: {
      identity: grant,
      terminate: () => raw.setContext({ ...context, access: false }),
      dispose: () => controller.dispose(),
      getQuery: () => controller.getSnapshot().query,
    },
    controller,
    resource,
    context,
    observerInput(query: DemoQuery) {
      return { ...currentInput, query };
    },
    command(command: TableCommand<typeof schema>, mode: ReadMode = "normal") {
      nextMode = mode;
      correctionCount = 0;
      controller.dispatch(command);
      nextMode = "normal";
    },
    refresh(mode: ReadMode = "normal") {
      correctionCount = 0;
      const token = begin(controller.getSnapshot().query);
      if (token) void execute(token, mode);
    },
    retry(mode: ReadMode = "normal") {
      retryMode = mode;
      return raw.retry();
    },
    revoke() {
      authorization.revoke(grant);
    },
    correctionCount: () => correctionCount,
  };
}
export type DemoRuntime = NonNullable<ReturnType<typeof createDemoRuntime>>;
