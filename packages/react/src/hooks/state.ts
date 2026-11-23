import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { QueryFor, QuerySchema } from "../contracts/types.js";
import type { TableController, TableState } from "../controller/types.js";

export function useTableweaveState<S extends QuerySchema>(
  controller: TableController<S>,
): TableState<S> {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );
}
export function useTableweaveSelector<S extends QuerySchema, Value>(
  controller: TableController<S>,
  selector: (state: TableState<S>) => Value,
  equal: (a: Value, b: Value) => boolean = Object.is,
): Value {
  // Reader memoization is render-local; this baseline survives new selector or
  // equality functions. Publish it only after commit, never from a speculative read.
  const committed = useRef<{ value: Value } | null>(null);
  const readers = useMemo(() => {
    let cached: { state: TableState<S>; value: Value } | undefined;
    const read = (state: TableState<S>): Value => {
      if (cached?.state === state) return cached.value;
      const value = selector(state);
      const previous = cached ?? committed.current;
      if (previous && equal(previous.value, value)) {
        cached = { state, value: previous.value };
      } else cached = { state, value };
      return cached.value;
    };
    return {
      client: () => read(controller.getSnapshot()),
      server: () => read(controller.getServerSnapshot()),
    };
  }, [controller, selector, equal]);
  const value = useSyncExternalStore(
    controller.subscribe,
    readers.client,
    readers.server,
  );
  useEffect(() => {
    committed.current = { value };
  }, [value]);
  return value;
}
export function useTableweaveQuery<S extends QuerySchema>(
  controller: TableController<S>,
): QueryFor<S> {
  return useTableweaveSelector(controller, (state) => state.query);
}
