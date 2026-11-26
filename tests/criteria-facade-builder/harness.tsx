import {
  type DataTableModel,
  requireDataTableModel,
  useDataTable,
} from "@tableweave/react";
import { StrictMode, Suspense, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  builderActions,
  builderEditor,
  createCriteriaBuilderStore,
} from "../../packages/heroui/src/filters/criteria-builder-host.js";
import {
  createCriteriaFacadeSource,
  getCriteriaFacadeInput,
  publishCriteriaFacadeSource,
} from "../../packages/heroui/src/filters/criteria-facade-config.js";
import { englishDataTableLocale } from "../../packages/heroui/src/localization/data-table.js";
import { createTableRendererCell } from "../../packages/heroui/src/table/renderer-commit.js";
import type {
  TableRendererConfig,
  TableRendererLease,
  TableRendererToolConfigs,
} from "../../packages/heroui/src/table/types.js";
import { BuilderBridge } from "./bridge.js";
import { fixture, type Item, required, type S } from "./fixtures.js";

export type BuilderConfig = NonNullable<TableRendererToolConfigs<S>["builder"]>;

function CustomForm({ change }: { readonly change: (value: string) => void }) {
  return (
    <label>
      Custom note
      <input
        aria-label="Custom note"
        defaultValue="synthetic custom draft"
        onChange={(event) => change(event.currentTarget.value)}
      />
    </label>
  );
}

export function harness(complete = false) {
  const f = fixture(complete);
  let model: DataTableModel<S, Item> | null = null;
  let producer: ReturnType<typeof initialize> | null = null;
  let visible = false;
  let suspended = false;
  const never = new Promise<never>(() => {});
  const options = {
    idType: "string" as const,
    source: f.options,
    onRequest(request: Parameters<typeof f.options.succeed>[0]) {
      f.counts.transport++;
      f.options.succeed(request, {
        options: [
          { id: "a", label: "Synthetic Alpha" },
          { id: "b", label: "Synthetic Beta" },
        ],
        hasMore: false,
      });
    },
  };
  const uiConfig: BuilderConfig = {
    evaluationMode: complete ? "server" : "client",
    className: "synthetic-ui-A",
    fields: {
      amount: { label: "Amount" },
      created: { label: "Created" },
      note: {
        label: "Note",
        renderEditor: (props) => <CustomForm change={props.onChange} />,
      },
      status: { label: "Status", asyncOptions: options },
    },
    onMutation: f.observe,
  };
  let config: TableRendererConfig<S, Item> = {
    locale: englishDataTableLocale,
    tools: { builder: uiConfig },
  };
  function initialize(value: DataTableModel<S, Item>) {
    const cell = createTableRendererCell(value);
    return { cell, source: createCriteriaFacadeSource(cell, "builder") };
  }
  function Gate() {
    if (suspended) throw never;
    return null;
  }
  function Screen() {
    const table = useDataTable(f.D, f.input());
    model = table;
    const [parent] = useState(() => initialize(table));
    producer = parent;
    const lease = useRef<TableRendererLease<S, Item> | null>(null);
    const committedConfig = useRef<object | null>(null);
    useLayoutEffect(() => {
      const acquired = parent.cell.connect();
      lease.current = acquired;
      return () => {
        lease.current = null;
        committedConfig.current = null;
        parent.cell.disconnect(acquired);
      };
    }, [parent]);
    useLayoutEffect(() => {
      if (!lease.current) return;
      try {
        requireDataTableModel(table, f.D);
        if (table.phase !== "display") return;
        if (
          parent.cell.getSnapshot().actor &&
          committedConfig.current === config
        )
          parent.cell.updateModel(lease.current, table);
        else {
          parent.cell.commit(lease.current, table, config);
          committedConfig.current = config;
        }
        const actor = parent.cell.getSnapshot().actor;
        if (actor)
          publishCriteriaFacadeSource(parent.source, {
            cell: parent.cell,
            actor,
          });
      } catch {
        /* Actual unready/denied models are not a renderer grant. */
      }
    }, [parent, table, config]);
    return (
      <main
        onKeyDownCapture={(event) => {
          if (!event.altKey) return;
          if (event.key === "r") {
            event.preventDefault();
            config = { ...config };
            render();
          }
        }}
      >
        {visible ? (
          <BuilderBridge cell={parent.cell} source={parent.source} />
        ) : null}
        <Gate />
      </main>
    );
  }
  const node = document.createElement("section");
  document.body.append(node);
  const root = createRoot(node);
  const render = () =>
    flushSync(() =>
      root.render(
        <StrictMode>
          <Suspense fallback={<p>Suspended Builder candidate</p>}>
            <Screen />
          </Suspense>
        </StrictMode>,
      ),
    );
  render();
  function actual() {
    const table = required(model),
      parent = required(producer);
    requireDataTableModel(table, f.D);
    if (table.phase !== "display" || !table.toolTarget)
      throw new Error("Actual display model required");
    return { table, parent, target: table.toolTarget };
  }
  function builderConfig(values: Partial<BuilderConfig>): BuilderConfig {
    return {
      fields: {},
      evaluationMode:
        actual().table.metadata?.mode === "client" ? "client" : "server",
      ...values,
    };
  }
  function probe(seed?: BuilderConfig) {
    const current = actual();
    let table = current.table;
    const cell = createTableRendererCell(table),
      lease = cell.connect();
    const source = createCriteriaFacadeSource(cell, "builder");
    const store = createCriteriaBuilderStore<S>(),
      unmount = store.mount();
    function publish(builder?: BuilderConfig) {
      const actor = cell.commit(lease, table, {
        locale: englishDataTableLocale,
        tools: builder ? { builder } : {},
      });
      return publishCriteriaFacadeSource(source, { cell, actor });
    }
    const initial = publish(seed);
    store.commit(initial);
    const stops: (() => void)[] = [];
    const counts = { connect: 0, subscribe: 0, sourceNotifications: 0 };
    return {
      cell,
      lease,
      source,
      store,
      target: current.target,
      publish,
      input: () => getCriteriaFacadeInput(source),
      frame: () => required(store.read()),
      open(id: string, part: "field" | "operator" | "value" = "value") {
        const frame = required(store.read());
        builderActions.open(
          store,
          frame.actor,
          `${id}:${part}`,
          part,
          required(frame.local.receipt.read(frame.actor)).token,
          id,
        );
        return builderEditor(store, frame.actor);
      },
      connectOptions() {
        const actor = required(store.read()).actor;
        store.syncOptions(actor);
        const connection = required(store.connections()[0]);
        counts.connect++;
        stops.push(store.connect(connection));
        counts.subscribe++;
        stops.push(f.options.subscribe(() => counts.sourceNotifications++));
        store.syncOptions(actor);
      },
      counts,
      refreshModel() {
        table = actual().table;
        cell.updateModel(lease, table);
        const actor = required(cell.getSnapshot().actor);
        return publishCriteriaFacadeSource(source, { cell, actor });
      },
      dispose() {
        for (const stop of stops.reverse()) stop();
        store.releaseOptions();
        unmount();
        cell.disconnect(lease);
      },
    };
  }
  return {
    f,
    actual,
    probe,
    options,
    builderConfig,
    render,
    show() {
      visible = true;
      render();
    },
    refresh() {
      config = { ...config };
      render();
    },
    query() {
      f.app.change({
        type: "sorting.change",
        update: [{ id: "amount", desc: true }],
      });
      render();
    },
    suspend() {
      suspended = true;
      config = {
        ...config,
        tools: { builder: builderConfig({ className: "uncommitted-B" }) },
      };
      render();
    },
    abandon() {
      suspended = false;
      config = { ...config, tools: { builder: uiConfig } };
      render();
    },
    reset() {
      const result = f.app.reset();
      const completed = f.app.P.complete(result.ticket);
      if (completed.status !== "settled")
        throw new Error("Actual reset acknowledgement failed");
      render();
    },
    unmount() {
      flushSync(() => root.unmount());
      node.remove();
      f.dispose();
    },
  };
}
export type Harness = ReturnType<typeof harness>;
