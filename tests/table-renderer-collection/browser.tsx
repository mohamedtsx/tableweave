import {
  type DataTableModel,
  type NativeCell,
  requireDataTableModel,
  useDataTable,
} from "@tableweave/react";
import { StrictMode, Suspense, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { SelectionToolbar } from "../../packages/heroui/src/selection/selection-toolbar.js";
import { NativeCollection } from "../../packages/heroui/src/table/native-collection.js";
import { TableRendererNativeContent } from "../../packages/heroui/src/table/renderer-collection.js";
import {
  captureTableRendererProp,
  createTableRendererCell,
  getTableRendererOwner,
  requireTableRendererMember,
  requireTableRendererTarget,
} from "../../packages/heroui/src/table/renderer-commit.js";
import type {
  TableRendererCell,
  TableRendererConfig,
  TableRendererLease,
  TableRendererTarget,
} from "../../packages/heroui/src/table/types.js";
import { fixture, type Item, type S, type Shape } from "./fixtures.js";

type Model = DataTableModel<S, Item>;
function mount(shape: Shape, sourceOnly = false) {
  const f = fixture(shape, sourceOnly),
    container = document.createElement("section");
  container.id = `fixture-${shape}`;
  document.body.append(container);
  const root = createRoot(container);
  let options = f.options();
  let model: Model | null = null,
    cell: TableRendererCell<S, Item> | null = null,
    lease: TableRendererLease<S, Item> | null = null,
    target: TableRendererTarget<S, Item> | null = null;
  let setTarget: ((target: TableRendererTarget<S, Item>) => void) | null = null,
    revision = 0,
    revokeOnText = false;
  let oldRows: readonly unknown[] = [],
    oldCells: readonly unknown[] = [],
    oldColumns: readonly unknown[] = [],
    savedAction: (() => unknown) | null = null,
    savedCancel: (() => unknown) | null = null;
  let resolveAction: (() => void) | null = null;
  let restoreContext: (() => void) | null = null;
  let switchOnRestore = false;
  let foreignFocus: HTMLInputElement | null = null;
  const state = () => {
    if (!model || !cell || !lease)
      throw new Error("Actual model/renderer missing");
    return { model, cell, lease };
  };
  function config(
    version: "A" | "B",
    async = false,
  ): TableRendererConfig<S, Item> {
    return {
      collection: {
        label: "Synthetic collection",
        rowHeaderColumnId: "amount",
        rowTextValue(row) {
          f.counts.rowText++;
          return row.original.title;
        },
        columnTextValue(column) {
          f.counts.columnText++;
          return column.id;
        },
        cellTextValue(value) {
          f.counts.cellText++;
          if (revokeOnText) {
            revokeOnText = false;
            f.app.reset();
          }
          return value.row.original.title;
        },
      },
      actions: [
        {
          id: "same-action",
          label: `Act ${version}`,
          onAction(context) {
            if (
              context.loadedSelected[0]?.record.amount !== undefined &&
              typeof context.loadedSelected[0].record.amount !== "number"
            )
              throw 0;
            if (version === "A") f.counts.actionA++;
            else f.counts.actionB++;
            if (async)
              return new Promise<void>((_resolve, reject) => {
                resolveAction = () =>
                  reject(new Error("Synthetic app failure"));
              });
          },
        },
      ],
      onError() {
        if (version === "A") f.counts.errorA++;
        else f.counts.errorB++;
      },
      getRestoreFocusTarget() {
        if (version === "A") f.counts.focusA++;
        else f.counts.focusB++;
        if (switchOnRestore) {
          switchOnRestore = false;
          const data = state();
          const actor = data.cell.commit(data.lease, data.model, config("B"));
          target = { cell: data.cell, actor };
          setTarget?.(target);
          foreignFocus?.focus(); // App-owned new dialog/region, not library restoration.
        }
        return container.querySelector<HTMLInputElement>(
          '[aria-label="Normal tool"]',
        );
      },
    };
  }
  function View() {
    const current = useDataTable(f.D, options);
    const [owned] = useState(() => createTableRendererCell(current));
    const [displayTarget, updateTarget] = useState<TableRendererTarget<
      S,
      Item
    > | null>(null);
    const [, refresh] = useState(0);
    useLayoutEffect(() => {
      cell = owned;
      const mounted = owned.connect();
      lease = mounted;
      setTarget = updateTarget;
      const stop = owned.subscribe(() => refresh((n) => n + 1));
      return () => {
        stop();
        owned.disconnect(mounted);
      };
    }, [owned]);
    useLayoutEffect(() => {
      try {
        requireDataTableModel(current, f.D);
        if (!current.sourceTarget) return;
        if (owned.getSnapshot().actor && lease)
          owned.updateModel(lease, current);
        model = current;
      } catch {
        /* Await actual P2 committed model, never erase A merely for waiting. */
      }
    }, [current, owned]);
    return (
      <>
        <output data-phase>
          {current.phase}:{revision}
        </output>
        {displayTarget &&
        current.view &&
        current.authority &&
        current.presentation ? (
          <>
            <SelectionToolbar
              renderer={displayTarget}
              authority={current.authority}
              presentation={current.presentation}
              normal={<input aria-label="Normal tool" defaultValue="normal" />}
            />
            <Suspense fallback={<span data-suspended>Suspended</span>}>
              <NativeCollection
                renderer={displayTarget}
                view={current.view}
                label="Ignored uncommitted label"
                rowHeaderColumnId="amount"
                rowTextValue={() => {
                  throw new Error("Uncommitted row port traversed");
                }}
                columnTextValue={() => {
                  throw 0;
                }}
                cellTextValue={() => {
                  throw 0;
                }}
              />
            </Suspense>
          </>
        ) : null}
      </>
    );
  }
  function render() {
    root.render(
      <StrictMode>
        <View />
      </StrictMode>,
    );
  }
  render();
  function actualTarget() {
    if (!target) throw new Error("No actual committed actor");
    return target;
  }
  // Test-only pinned React19 DOM/Fiber inspection captures the ACTUAL producer's
  // onPress before replacement, not a permitting toolbar/gate mock. Not a public API.
  function capturedPress(label: string): () => unknown {
    const button = [...container.querySelectorAll("button")].find(
      (node) => node.textContent?.trim() === label,
    );
    if (!button) throw new Error(`Missing button ${label}`);
    const key = Object.keys(button).find((key) =>
      key.startsWith("__reactFiber$"),
    );
    if (!key) throw 0;
    let fiber = (button as unknown as Record<string, unknown>)[key] as {
      memoizedProps?: Record<string, unknown>;
      return?: unknown;
    } | null;
    while (fiber) {
      const props = fiber.memoizedProps;
      if (props?.children === label && typeof props.onPress === "function")
        return props.onPress as () => unknown;
      fiber = fiber.return as typeof fiber;
    }
    throw new Error("Actual Button onPress not found");
  }
  return {
    commit(version: "A" | "B" = "A", async = false) {
      const data = state();
      const actor = data.cell.commit(
        data.lease,
        data.model,
        config(version, async),
      );
      target = { cell: data.cell, actor };
      setTarget?.(target);
    },
    select() {
      f.app.change({ type: "selection.change", update: { r1: true } });
    },
    addSelection() {
      f.app.change({
        type: "selection.change",
        update: { r1: true, r2: true },
      });
    },
    cancel() {
      f.app.change({ type: "selection.cancel" });
    },
    query() {
      f.app.change({ type: "search.commit", search: "Synthetic" });
    },
    replace() {
      const view = state().model.view;
      if (!view) throw 0;
      oldRows = view.rows;
      oldColumns = view.visibleColumns;
      oldCells = view.rows.flatMap((row) => row.getVisibleCells());
      f.replace();
      options = f.options();
      revision++;
      render();
    },
    saveHandlers() {
      savedAction = capturedPress("Act A");
      savedCancel = capturedPress("Cancel");
    },
    invokeSaved() {
      savedAction?.();
      savedCancel?.();
    },
    invokeSavedAction() {
      savedAction?.();
    },
    armFocusHandoff() {
      switchOnRestore = true;
      const foreign = document.createElement("fieldset");
      foreign.dataset.selectionActive = "true";
      foreignFocus = document.createElement("input");
      foreignFocus.setAttribute("aria-label", "New foreign region");
      foreign.append(foreignFocus);
      document.body.append(foreign);
    },
    resolve() {
      resolveAction?.();
    },
    unknowns() {
      const data = state(),
        real = actualTarget();
      let reads = 0;
      const proxy = new Proxy(data.cell, {
        get() {
          reads++;
          throw 0;
        },
        getOwnPropertyDescriptor() {
          reads++;
          throw 0;
        },
      });
      const copied = { ...data.cell };
      const targets = [
        undefined,
        null,
        {},
        { cell: proxy, actor: real.actor },
        { cell: copied, actor: real.actor },
        {
          cell: data.cell,
          actor: new Proxy(real.actor, {
            get() {
              reads++;
              throw 0;
            },
          }),
        },
        { cell: data.cell, actor: { ...real.actor } },
      ];
      const denied = targets.map(
        (value) =>
          captureTableRendererProp({ renderer: value }).kind === "denied",
      );
      const getter = Object.defineProperty({}, "renderer", {
        get() {
          reads++;
          throw 0;
        },
      });
      denied.push(
        captureTableRendererProp(getter).kind === "denied",
        captureTableRendererProp(Object.create({ renderer: real })).kind ===
          "denied",
      );
      return {
        denied,
        reads,
        proxyOwner: getTableRendererOwner(proxy),
        copyAccepted:
          requireTableRendererTarget({ ...real }).actor === real.actor,
      };
    },
    arguments() {
      const data = requireTableRendererTarget(actualTarget()),
        collection = data.ports.collection,
        view = data.model.view;
      if (!collection || !view?.rows[0] || !view.visibleColumns[0]) throw 0;
      let reads = 0;
      const fake = new Proxy(
        {},
        {
          get() {
            reads++;
            throw 0;
          },
        },
      );
      const attempts = [
        () => collection.rowTextValue(fake as never),
        () => collection.columnTextValue(fake as never),
        () => collection.cellTextValue(fake as never),
      ];
      const denied = attempts.map((read) => {
        try {
          read();
          return false;
        } catch {
          return true;
        }
      });
      const current = collection.rowTextValue(view.rows[0]);
      return {
        denied,
        reads,
        current,
        oldDenied: [
          ...oldRows.map(
            (value) => () => collection.rowTextValue(value as never),
          ),
          ...oldColumns.map(
            (value) => () => collection.columnTextValue(value as never),
          ),
          ...oldCells.map(
            (value) => () => collection.cellTextValue(value as never),
          ),
        ].every((read) => {
          try {
            read();
            return false;
          } catch {
            return true;
          }
        }),
      };
    },
    revokeText() {
      revokeOnText = true;
      f.replace();
      options = f.options();
      render();
    },
    contextReentry() {
      const data = state(),
        view = data.model.view;
      const native = view?.rows[0]
        ?.getVisibleCells()
        .find((value) => value.column.id === "title");
      if (!native) throw 0;
      requireTableRendererMember(actualTarget(), "cell", native);
      const original = native.getContext,
        before = f.counts.body;
      // DENIAL ONLY: mutate the genuine vendor context method to revoke while
      // returning its genuine context, then restore it; no fake permitting native.
      native.getContext = function (this: NativeCell<Item>) {
        f.app.reset();
        return original.call(this);
      };
      const child = document.createElement("div");
      container.append(child);
      const childRoot = createRoot(child);
      childRoot.render(
        <TableRendererNativeContent target={actualTarget()} cell={native} />,
      );
      restoreContext = () => {
        native.getContext = original;
        childRoot.unmount();
      };
      return before;
    },
    restoreContext() {
      restoreContext?.();
    },
    reset() {
      f.app.reset();
      render();
    },
    state() {
      let valid = false;
      try {
        if (target) {
          requireTableRendererTarget(target);
          valid = true;
        }
      } catch {
        /* Denial metadata only. */
      }
      return {
        ready: !!model,
        valid,
        phase: model?.phase,
        counts: { ...f.counts },
        revision: model?.state?.revision,
        selected: Object.keys(f.app.C.getSnapshot().selection),
        publicationRetirements: f.app.counts.retire,
        cSame: model?.controller === f.app.C,
        cdSame: f.app.C.getDefinition() === f.app.CD,
      };
    },
  };
}
const params = new URLSearchParams(location.search),
  shape = (params.get("shape") ?? "hook") as Shape;
const api = mount(shape, params.has("sourceOnly"));
declare global {
  interface Window {
    rendererCollection: typeof api;
  }
}
window.rendererCollection = api;
