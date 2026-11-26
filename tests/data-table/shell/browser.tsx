import { type DataTableModel, useDataTable } from "@tableweave/react";
import {
  type ReactNode,
  StrictMode,
  Suspense,
  useLayoutEffect,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { DataTable } from "../../../packages/heroui/src/data-table/data-table.js";
import { getDetailsBinding } from "../../../packages/heroui/src/data-table/details-binding.js";
import { useDetailsAccessory } from "../../../packages/heroui/src/data-table/details-provider.js";
import {
  arabicDataTableLocale,
  arabicDataTableNeutralMessages,
  englishDataTableLocale,
} from "../../../packages/heroui/src/localization/data-table.js";
import {
  createTableRendererCell,
  requireTableRendererSourceTarget,
} from "../../../packages/heroui/src/table/renderer-commit.js";
import type {
  DataTableProps,
  TableRendererConfig,
} from "../../../packages/heroui/src/table/types.js";
import { type Fixture, fixture, type Item, type S } from "./fixtures.js";
import "../../../apps/storybook/src/styles.css";
// Only the fixture activates the otherwise unimported main-owned shell stylesheet.
import "../../../packages/heroui/src/data-table/styles.css";

function ToolbarForm() {
  const [value, setValue] = useState("Controlled draft");
  return (
    <form aria-label="Custom toolbar form">
      <input
        aria-label="Controlled toolbar draft"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <input
        aria-label="Uncontrolled toolbar draft"
        defaultValue="Uncontrolled draft"
      />
    </form>
  );
}
function StateForm() {
  return <input aria-label="Custom state draft" defaultValue="State draft" />;
}
function mount(f: Fixture, arabic = false, withAccessory = true) {
  const rootNode = document.createElement("article");
  rootNode.setAttribute("data-shell-fixture", arabic ? "arabic" : "english");
  document.body.append(rootNode);
  const root = createRoot(rootNode);
  let model: DataTableModel<S, Item> | null = null,
    accessory: ReturnType<typeof useDetailsAccessory<S, Item>> | null = null;
  let custom = false,
    suspended = false,
    revision = 0,
    show = true,
    foreign = false,
    reads = 0,
    toolbar = 0,
    state = 0,
    retries = 0;
  let extra: Partial<TableRendererConfig<S, Item>> = {};
  const never = new Promise<never>(() => {});
  const messages = {
    label: "Synthetic shell search",
    placeholder: "Search shell records",
  };
  const tools = {
    search: { messages },
    tabs: {
      tabs: {
        all: { label: "All records" },
        active: { label: "Active records" },
      },
      neutralTab: { label: "Any records" },
      children: (
        <input
          aria-label="External result draft"
          defaultValue="External draft"
        />
      ),
    },
    date: {},
  };
  const actions = [
    {
      id: "inspect",
      label: "Inspect selection",
      onAction() {
        revision++;
      },
    },
  ];
  const layout = {
    id: arabic ? "arabic-shell" : "english-shell",
    className: "synthetic-shell",
  };
  const customToolbar = (
    ctx: Parameters<NonNullable<DataTableProps<S, Item>["renderToolbar"]>>[0],
  ) => {
    toolbar++;
    return (
      <>
        {ctx.defaultContent}
        <ToolbarForm />
      </>
    );
  };
  const customState = () => {
    state++;
    return <StateForm />;
  };
  const onRetry = () => {
    retries++;
    f.start();
  };
  function App() {
    const table = useDataTable(f.D, f.options()),
      other = useDataTable(f.D, f.options()),
      details = useDetailsAccessory(table, f.details());
    model = table;
    accessory = details;
    const props: DataTableProps<S, Item> = {
      table: foreign ? other : table,
      collection: f.collection,
      layout,
      locale: arabic ? arabicDataTableLocale : englishDataTableLocale,
      neutralMessages: arabic
        ? arabicDataTableNeutralMessages
        : englishDataTableLocale.neutralMessages,
      ...(withAccessory ? { accessory: details } : {}),
      tools,
      actions,
      ...(custom
        ? { renderToolbar: customToolbar, renderState: customState }
        : {}),
      onRetry,
      ...extra,
    };
    useLayoutEffect(() => {
      void revision;
    });
    if (suspended) {
      const candidate = new Proxy(f.collection, {
        getOwnPropertyDescriptor(target, key) {
          reads++;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });
      return (
        <>
          <DataTable {...props} collection={candidate} />
          <Suspend />
        </>
      );
    }
    return show ? <DataTable {...props} /> : null;
  }
  function Suspend(): ReactNode {
    throw never;
  }
  const render = () =>
    flushSync(() =>
      root.render(
        <StrictMode>
          <Suspense fallback={<p>Suspended shell candidate</p>}>
            <App />
          </Suspense>
        </StrictMode>,
      ),
    );
  render();
  function latest() {
    if (!model || !accessory)
      throw new Error("Actual committed model/accessory required");
    return { model, accessory };
  }
  return {
    render,
    status() {
      const a = latest();
      return {
        phase: a.model.phase,
        recovery: a.model.recovery,
        counters: { ...f.counters },
        toolbar,
        state,
        retries,
        reads,
        revision,
        detailsActor: !!getDetailsBinding(a.accessory).getSnapshot().actor,
      };
    },
    custom() {
      custom = true;
      render();
    },
    refresh() {
      render();
    },
    select() {
      f.app.change({
        type: "selection.change",
        update: () => ({ one: true, offpage: true }),
      });
      render();
    },
    sort() {
      f.app.change({
        type: "sorting.change",
        update: [{ id: "amount", desc: true }],
      });
      render();
    },
    reset() {
      f.app.reset();
      render();
    },
    open(id = "one") {
      const a = latest(),
        binding = getDetailsBinding(a.accessory),
        actor = binding.getSnapshot().actor;
      if (!actor) throw new Error("No actual details actor");
      return binding.open(actor, id).then(() => render());
    },
    dirty() {
      f.dirty(true);
    },
    resolve() {
      f.resolve(true);
      render();
    },
    refetch() {
      f.refetch();
      render();
    },
    foreign() {
      foreign = true;
      render();
    },
    detach() {
      show = false;
      render();
    },
    reattach() {
      show = true;
      render();
    },
    suspend() {
      suspended = true;
      render();
    },
    malformed() {
      extra = {
        layout: new Proxy(
          { id: "invalid" },
          {
            getOwnPropertyDescriptor() {
              throw new Error("Synthetic layout denial");
            },
          },
        ),
      };
      render();
    },
    remote(complete = false) {
      f.remote(complete);
      render();
    },
    start() {
      f.start();
      render();
    },
    succeed(empty: "dataset" | "filtered" | "unknown" | null = null) {
      f.succeed(empty);
      render();
    },
    fail() {
      f.fail();
      render();
    },
    sourceCallbackOwnership() {
      const a = latest(),
        cell = createTableRendererCell(a.model),
        lease = cell.connect();
      const metadata = a.model.metadata;
      if (!metadata) throw new Error("Actual source metadata required");
      let callsA = 0,
        callsB = 0;
      try {
        const actorA = cell.commit(lease, a.model, {
            renderState() {
              callsA++;
              return null;
            },
          }),
          old = requireTableRendererSourceTarget({ cell, actor: actorA }).ports
            .renderState;
        cell.commit(lease, a.model, {
          renderState() {
            callsB++;
            return null;
          },
        });
        let rejected = false;
        try {
          old?.({
            model: a.model,
            recovery: a.model.recovery,
            metadata,
          });
        } catch {
          rejected = true;
        }
        return { rejected, callsA, callsB };
      } finally {
        cell.disconnect(lease);
      }
    },
    oldDetails() {
      const a = latest(),
        binding = getDetailsBinding(a.accessory),
        actor = binding.getSnapshot().actor;
      if (!actor) throw new Error("Actual actor required");
      return {
        open: () => binding.open(actor, "two"),
        close: () => binding.request(actor, null, "programmatic"),
        focus: () => binding.focusOnce(actor),
      };
    },
    wrongJoin() {
      const a = latest(),
        binding = getDetailsBinding(a.accessory),
        cell = createTableRendererCell(a.model),
        lease = cell.connect();
      let denied = false;
      try {
        const actor = cell.commit(lease, a.model, { collection: f.collection });
        void actor;
        try {
          binding.claimTable(cell);
        } catch {
          denied = true;
        }
        binding.releaseTable(Object.freeze({}));
        return { denied, oldAlive: !!binding.getSnapshot().actor };
      } finally {
        cell.disconnect(lease);
      }
    },
    counters: () => ({ ...f.counters }),
    dictionaryReceiver() {
      let calls = 0,
        bad = 0;
      const dictionary = {
        rowCheckbox(value: string) {
          calls++;
          if (this !== dictionary) bad++;
          return `Select ${value}`;
        },
      };
      extra = { messages: { collection: dictionary } };
      render();
      return { calls, bad };
    },
    publicationABA() {
      const a = latest(),
        cell = createTableRendererCell(a.model),
        lease = cell.connect();
      let calls = 0;
      try {
        const actor = cell.commit(lease, a.model, {
            renderState() {
              calls++;
              return null;
            },
          }),
          saved = cell.require(actor).ports.renderState;
        f.app.reset();
        f.app.prepare();
        f.app.settle();
        let denied = false;
        try {
          saved?.({
            model: a.model,
            recovery: a.model.recovery,
            metadata:
              a.model.metadata ??
              (() => {
                throw new Error("Source required");
              })(),
          });
        } catch {
          denied = true;
        }
        render();
        return { denied, calls, actor: cell.getSnapshot().actor === null };
      } finally {
        cell.disconnect(lease);
      }
    },
    oldRetry() {
      const a = latest(),
        cell = createTableRendererCell(a.model),
        lease = cell.connect();
      let callsA = 0,
        callsB = 0;
      try {
        const actor = cell.commit(lease, a.model, {
            onRetry() {
              callsA++;
            },
          }),
          saved = cell.require(actor).ports.onRetry;
        cell.commit(lease, a.model, {
          onRetry() {
            callsB++;
          },
        });
        let denied = false;
        try {
          void saved?.()?.catch(() => {});
        } catch {
          denied = true;
        }
        return { denied, callsA, callsB };
      } finally {
        cell.disconnect(lease);
      }
    },
    async staleStateCompletion() {
      const a = latest(),
        cell = createTableRendererCell(a.model),
        lease = cell.connect();
      let finish: (value: null) => void = () => {
        throw new Error("Pending callback required");
      };
      const pending = new Promise<null>((resolve) => {
        finish = resolve;
      });
      try {
        const actor = cell.commit(lease, a.model, {
            renderState() {
              return pending;
            },
          }),
          callback = cell.require(actor).ports.renderState,
          metadata = a.model.metadata;
        if (!metadata) throw new Error("Actual metadata required");
        const result = callback?.({
          model: a.model,
          recovery: a.model.recovery,
          metadata,
        });
        if (!(result instanceof Promise))
          throw new Error("Actual owned Promise required");
        cell.commit(lease, a.model, {});
        finish(null);
        try {
          await result;
          return { denied: false };
        } catch {
          return { denied: true };
        }
      } finally {
        cell.disconnect(lease);
      }
    },
    disabledPorts() {
      const a = latest(),
        cell = createTableRendererCell(a.model),
        lease = cell.connect();
      let reads = 0;
      const config: TableRendererConfig<S, Item> = {
        collection: f.collection,
        get formatNumber(): NonNullable<
          TableRendererConfig<S, Item>["formatNumber"]
        > {
          reads++;
          throw new Error("Unused disabled formatter");
        },
        get paginationCorrection(): NonNullable<
          TableRendererConfig<S, Item>["paginationCorrection"]
        > {
          reads++;
          throw new Error("Unused disabled correction");
        },
      };
      try {
        const actor = cell.commit(lease, a.model, config);
        return {
          reads,
          actor: cell.getSnapshot().actor === actor,
          formatter: cell.require(actor).ports.formatNumber === undefined,
        };
      } finally {
        cell.disconnect(lease);
      }
    },
    dispose() {
      flushSync(() => root.unmount());
      rootNode.remove();
      f.dispose();
    },
  };
}
const complete = fixture(false);
complete.remote(true);
const remote = fixture();
remote.remote();
const api = {
  minimal: mount(fixture(true, false), false, false),
  configured: mount(fixture()),
  disabled: mount(fixture(false)),
  arabic: mount(fixture(true), true),
  complete: mount(complete),
  remote: mount(remote),
};
declare global {
  interface Window {
    tableShell: typeof api;
    oldShellDetails?: ReturnType<typeof api.configured.oldDetails>;
  }
}
window.tableShell = api;
