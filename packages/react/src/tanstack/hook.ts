import type { RowData } from "@tanstack/react-table";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { QuerySchema } from "../contracts/types.js";
import type { TableController } from "../controller/types.js";
import { useTableweaveState } from "../hooks/state.js";
import { createNativeBoundary } from "./boundary.js";
import { nativeFail } from "./definition.js";
import type {
  NativeDefinition,
  NativeInput,
  NativeTableView,
} from "./types.js";

const useCommitEffect = "window" in globalThis ? useLayoutEffect : useEffect;

export function useNativeTable<S extends QuerySchema, T extends RowData>(
  definition: NativeDefinition<S, T>,
  controller: TableController<S>,
  input: NativeInput<T>,
): NativeTableView<S, T> {
  // A definition/controller replacement needs an explicit keyed React boundary.
  // A mounted bridge has immutable feature/definition/controller ownership.
  const mounted = useRef({ definition, controller });
  if (
    mounted.current.definition !== definition ||
    mounted.current.controller !== controller
  )
    nativeFail("native.lifecycle");
  const [boundary] = useState(() =>
    createNativeBoundary(definition, controller),
  );
  const state = useTableweaveState(controller);
  const frame = boundary.prepare(input, state);
  useCommitEffect(() => {
    boundary.commit(frame);
  }, [boundary, frame]);
  // Return current models/metadata as props: native state subscriptions alone do
  // not invalidate memoized children when only records/totals/hasNextPage change.
  return boundary.getView(frame);
}
