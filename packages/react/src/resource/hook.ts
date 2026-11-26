import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { WireQuery } from "../contracts/types.js";
import type {
  ResourceAdapter,
  ResourceContext,
  ResourceView,
} from "./types.js";
import { projectResourceView } from "./view.js";

/** One committed lifetime owner per adapter. Begin app requests in an effect. */
export function useTableweaveResource<T, Q extends WireQuery = WireQuery>(
  adapter: ResourceAdapter<T, Q>,
  expected: ResourceContext,
): ResourceView<T, Q> {
  const view = useSyncExternalStore(
    adapter.subscribe,
    adapter.getSnapshot,
    adapter.getServerSnapshot,
  );
  const { definitionKey, scopeKey, access } = expected;
  const committed = useRef<{
    adapter: ResourceAdapter<T, Q>;
    context: ResourceContext;
  } | null>(null);
  // No connect/context writes during render: speculative renders cannot clear a
  // committed scope. The pure projection below still hides it before effects.
  // Suspense disconnects layout effects while hiding an otherwise mounted
  // owner, but leaves its passive request effects alive. Own the buffer in the
  // same passive lifetime so hide/reveal cannot cancel a request without the
  // application restarting it. Real unmount/StrictMode cleanup clears directly,
  // before later application passive-effect cleanup; no delayed cancellation.
  useEffect(() => adapter.connect(), [adapter]);
  useLayoutEffect(() => {
    const next = { definitionKey, scopeKey, access };
    const current = adapter.getSnapshot().context;
    const previous =
      committed.current?.adapter === adapter ? committed.current.context : null;
    const explicitlyRestored =
      previous?.access === false &&
      previous.definitionKey === definitionKey &&
      previous.scopeKey === scopeKey;
    // An old allowed prop must not undo a terminal request-side access loss on
    // StrictMode replay or remount. Only an explicit denied -> allowed prop
    // transition (or application setContext) can restore the same identity.
    if (
      current.access ||
      !access ||
      current.definitionKey !== definitionKey ||
      current.scopeKey !== scopeKey ||
      explicitlyRestored
    )
      adapter.setContext(next);
    committed.current = { adapter, context: next };
  }, [adapter, definitionKey, scopeKey, access]);
  return useMemo(
    () => projectResourceView(view, { definitionKey, scopeKey, access }),
    [view, definitionKey, scopeKey, access],
  );
}
