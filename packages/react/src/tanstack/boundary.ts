import {
  constructTable,
  FlexRender,
  type TableState as NativeState,
  type ReactTable,
  type RowData,
  Subscribe,
  type SubscribeSource,
  stateSlicesEqual,
} from "@tanstack/react-table";
import { atomToStore } from "@tanstack/table-core/reactivity";
import { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings";
import type { ReactNode } from "react";
import type { QuerySchema } from "../contracts/types.js";
import type { TableController, TableState } from "../controller/types.js";
import type { CriteriaNativeCallbacks } from "../presentation/criteria-callbacks.js";
import { createNativeAdapter } from "./adapter.js";
import { nativeFail } from "./definition.js";
import { nativeFeatures } from "./features.js";
import type {
  NativeDefinition,
  NativeFeatures,
  NativeInput,
  NativeTableHandle,
  NativeTableView,
} from "./types.js";

interface NativeFrame<S extends QuerySchema, T extends RowData> {
  readonly table: ReactTable<NativeFeatures, T>;
  readonly input: NativeInput<T>;
  readonly state: TableState<S>;
  readonly work?: CriteriaNativeCallbacks<S, T>;
}

function NativeSubscription<Source, Selected = Source>(
  defaultSource: SubscribeSource<NativeState<NativeFeatures>>,
  props: {
    source?: SubscribeSource<Source>;
    selector?: ((value: Source) => Selected) | undefined;
    children: ReactNode | ((value: Selected) => ReactNode);
  },
) {
  // Forward the documented overloads: absent source fixes Source to native
  // state, and absent selector fixes Selected to Source.
  const source =
    props.source ?? (defaultSource as unknown as SubscribeSource<Source>);
  const selector =
    props.selector ?? ((value: Source) => value as unknown as Selected);
  return Subscribe<Source, Selected>({
    source,
    selector,
    children: props.children,
  });
}

/** Native instances belong to immutable render frames, not a mutable React ref.
 * Only commit() publishes a frame to previously committed handles/subscribers.
 * Rows/columns keep their own real native table, so model actions cannot follow
 * a speculative data/options swap through a hidden shared vendor instance.
 */
export function createNativeBoundary<S extends QuerySchema, T extends RowData>(
  definition: NativeDefinition<S, T>,
  controller: TableController<S>,
) {
  const adapter = createNativeAdapter(definition, controller);
  const reactivity = storeReactivityBindings();
  const features = Object.freeze(
    Object.assign({}, nativeFeatures, { coreReactivityFeature: reactivity }),
  );
  const committed = reactivity.createWritableAtom<NativeFrame<S, T> | null>(
    null,
  );
  let bootstrap: NativeFrame<S, T> | null = null;
  const read = () =>
    committed.get() ?? bootstrap ?? nativeFail("native.lifecycle");
  const stateAtom = reactivity.createReadonlyAtom(
    () => read().table.store.get(),
    { debugName: "tableweave/committedNativeState", compare: stateSlicesEqual },
  );
  const store = atomToStore(stateAtom);
  function slice<Key extends keyof NativeState<NativeFeatures>>(key: Key) {
    return reactivity.createReadonlyAtom(() => read().table.store.get()[key], {
      debugName: `tableweave/committedNative/${key}`,
      compare: stateSlicesEqual,
    });
  }
  const atoms = Object.freeze({
    sorting: slice("sorting"),
    pagination: slice("pagination"),
    rowSelection: slice("rowSelection"),
    columnVisibility: slice("columnVisibility"),
    columnOrder: slice("columnOrder"),
    columnFilters: slice("columnFilters"),
    globalFilter: slice("globalFilter"),
  });
  // Bound once per mounted boundary, not recreated during render. Function.bind
  // erases generic overloads; restore exactly the vendor-facing overload type.
  const NativeSubscribe = NativeSubscription.bind(null, store) as ReactTable<
    NativeFeatures,
    T
  >["Subscribe"];
  const native: NativeTableHandle<T> = Object.freeze({
    Subscribe: NativeSubscribe,
    FlexRender,
    atoms,
    store,
    getColumn: (...args) => read().table.getColumn(...args),
    getRow: (...args) => read().table.getRow(...args),
    getRowModel: () => read().table.getRowModel(),
    getFilteredRowModel: () => read().table.getFilteredRowModel(),
    getSortedRowModel: () => read().table.getSortedRowModel(),
    getHeaderGroups: () => read().table.getHeaderGroups(),
    getVisibleLeafColumns: () => read().table.getVisibleLeafColumns(),
    setSorting: (update) => read().table.setSorting(update),
    setPagination: (update) => read().table.setPagination(update),
    setRowSelection: (update) => read().table.setRowSelection(update),
    setColumnVisibility: (update) => read().table.setColumnVisibility(update),
    setColumnOrder: (update) => read().table.setColumnOrder(update),
  });
  function prepare(
    input: NativeInput<T>,
    state: TableState<S>,
    work?: CriteriaNativeCallbacks<S, T>,
  ): NativeFrame<S, T> {
    work?.check();
    if (!input || typeof input !== "object") nativeFail("native.rows");
    const { mode, records } = input;
    if (!Array.isArray(records)) nativeFail("native.rows");
    let snapshot: NativeInput<T>;
    if (mode === "client") snapshot = Object.freeze({ mode, records });
    else if (mode === "server" || mode === "server-complete") {
      const page = input.pageInfo;
      // Capture the page once as well; unrecognized modes never become server.
      const pageInfo = page && Object.freeze({ ...page });
      if (mode === "server")
        snapshot = Object.freeze({ mode, records, pageInfo });
      else {
        if (pageInfo?.kind !== "known") return nativeFail("native.page");
        snapshot = Object.freeze({ mode, records, pageInfo });
      }
    } else return nativeFail("native.rows");
    const options = adapter.getOptions(snapshot, state, work);
    const table = constructTable<NativeFeatures, T>({
      ...options,
      features,
    });
    work?.check();
    adapter.bindTable(table, work);
    const frame = Object.freeze({
      input: snapshot,
      state,
      ...(work ? { work } : {}),
      table: Object.assign(table, {
        Subscribe: NativeSubscribe,
        FlexRender,
        state: table.store.get(),
      }),
    });
    bootstrap ??= frame;
    work?.check();
    return frame;
  }
  const latest = (identity: string) => {
    const frame = read();
    if (
      frame.state.queryIdentity !== identity ||
      controller.getSnapshot().queryIdentity !== identity
    )
      nativeFail("native.page");
    return adapter.getView(frame.table, frame.input, frame.state, frame.work);
  };
  function getView(frame: NativeFrame<S, T>): NativeTableView<S, T> {
    const view = adapter.getView(
      frame.table,
      frame.input,
      frame.state,
      frame.work,
    );
    const identity = frame.state.queryIdentity;
    return Object.freeze({
      ...view,
      native,
      // Old view callbacks retain only their query guard, not metadata/row
      // authority. A metadata-only committed refresh must revoke old Next too.
      nextPage: () => latest(identity).nextPage(),
      previousPage: () => latest(identity).previousPage(),
      selectPage: (selected: boolean) => latest(identity).selectPage(selected),
    });
  }
  return {
    prepare,
    getView,
    commit(frame: NativeFrame<S, T>) {
      frame.work?.check();
      bootstrap = frame;
      committed.set(frame);
      frame.work?.check();
    },
  };
}
