import {
  type DataTableModel,
  requireDataTableModel,
  useDataTable,
} from "@tableweave/react";
import { StrictMode, Suspense, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  type CriteriaLocalCell,
  createCriteriaCommitCell,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import {
  CriteriaFacadeToolbar,
  closeCriteriaFacadeHost,
  consumeCriteriaFacadeHostSkip,
  createCriteriaFacadeSource,
  criteriaFacadeIdentity,
  criteriaFacadeState,
  getCriteriaFacadeInput,
  prepareCriteriaFacadeHost,
  publishCriteriaFacadeSource,
} from "../../packages/heroui/src/filters/criteria-facade-config.js";
import { englishDataTableLocale } from "../../packages/heroui/src/localization/data-table.js";
import { createTableRendererCell } from "../../packages/heroui/src/table/renderer-commit.js";
import type {
  TableRendererConfig,
  TableRendererLease,
  TableRendererToolConfigs,
} from "../../packages/heroui/src/table/types.js";
import { createCriteriaToolbarStore } from "../../packages/heroui/src/toolbar/criteria-tool-host.js";
import { fixture, type Item, type S } from "./fixtures.js";
import "../../apps/storybook/src/styles.css";

function mount(complete = false) {
  const f = fixture(complete);
  let model: DataTableModel<S, Item> | null = null;
  let ui = false,
    suspend = false,
    gets = 0,
    observed = 0;
  let config: TableRendererConfig<S, Item> = {
    locale: englishDataTableLocale,
    tools: {
      search: {
        messages: { placeholder: "Synthetic search" },
        onMutation: () => {
          observed++;
        },
      },
      tabs: {
        tabs: { all: { label: "All" }, active: { label: "Active" } },
        neutralTab: { label: "Any" },
        children: (
          <input
            aria-label="Independent results draft"
            defaultValue="Results"
          />
        ),
      },
      date: {},
    },
  };
  let producer: ReturnType<typeof initialize> | null = null;
  const never = new Promise<never>(() => {});
  function initialize(value: DataTableModel<S, Item>) {
    const cell = createTableRendererCell(value);
    return {
      cell,
      sources: {
        search: createCriteriaFacadeSource(cell, "search"),
        tabs: createCriteriaFacadeSource(cell, "tabs"),
        date: createCriteriaFacadeSource(cell, "date"),
        builder: createCriteriaFacadeSource(cell, "builder"),
      },
    };
  }
  function Screen() {
    const table = useDataTable(f.D, f.options());
    model = table;
    const [parent] = useState(() => initialize(table));
    producer = parent;
    const lease = useRef<TableRendererLease<S, Item> | null>(null),
      last = useRef<object | null>(null);
    useLayoutEffect(() => {
      const actual = parent.cell.connect();
      lease.current = actual;
      return () => {
        lease.current = null;
        last.current = null;
        parent.cell.disconnect(actual);
      };
    }, [parent]);
    useLayoutEffect(() => {
      if (!lease.current) return;
      try {
        requireDataTableModel(table, f.D);
        if (table.phase !== "display") return;
        const actor = parent.cell.getSnapshot().actor;
        if (actor && last.current === config)
          parent.cell.updateModel(lease.current, table);
        else {
          parent.cell.commit(lease.current, table, config);
          last.current = config;
        }
        const current = parent.cell.getSnapshot().actor;
        if (!current) return;
        for (const source of Object.values(parent.sources))
          publishCriteriaFacadeSource(source, {
            cell: parent.cell,
            actor: current,
          });
      } catch {
        /* No candidate config read before actual parent layout admission. */
      }
    }, [parent, table, config]);
    if (suspend) throw never;
    return (
      <section>
        {ui ? (
          <>
            <CriteriaFacadeToolbar source={parent.sources.search} />
            <CriteriaFacadeToolbar source={parent.sources.tabs} />
            <CriteriaFacadeToolbar source={parent.sources.date} />
          </>
        ) : (
          <p>Actual source fixture</p>
        )}
      </section>
    );
  }
  const node = document.createElement("section");
  document.body.append(node);
  const root = createRoot(node);
  const render = () =>
    flushSync(() =>
      root.render(
        <StrictMode>
          <Suspense fallback={<p>Suspended facade candidate</p>}>
            <Screen />
          </Suspense>
        </StrictMode>,
      ),
    );
  render();
  function actual() {
    if (!producer || !model) throw new Error("Real P2 producer required");
    requireDataTableModel(model, f.D);
    const actor = producer.cell.getSnapshot().actor;
    if (!actor || !model.toolTarget)
      throw new Error("Actual display frame required");
    return { p: producer, model, actor, target: model.toolTarget };
  }
  function publish(next: TableRendererConfig<S, Item>) {
    actual();
    config = next;
    render();
  }
  function probeParent() {
    const a = actual(),
      cell = createTableRendererCell(a.model),
      lease = cell.connect(),
      source = createCriteriaFacadeSource(cell, "search");
    const all = {
      ...config,
      tools: { search: { messages: { placeholder: "X" } } },
    };
    let actor = cell.commit(lease, a.model, all);
    publishCriteriaFacadeSource(source, { cell, actor });
    return {
      cell,
      lease,
      source,
      model: a.model,
      target: a.target,
      publish(cfg: unknown) {
        const next: TableRendererConfig<S, Item> = {
          ...config,
          tools: {
            search: cfg as NonNullable<
              NonNullable<TableRendererConfig<S, Item>["tools"]>["search"]
            >,
          },
        };
        actor = cell.commit(lease, a.model, next);
        return publishCriteriaFacadeSource(source, { cell, actor });
      },
      input: () => getCriteriaFacadeInput(source),
      dispose: () => cell.disconnect(lease),
    };
  }
  function supersede(
    throwTrap = false,
    variant:
      | "normal"
      | "malformed"
      | "reset"
      | "reentry"
      | "initial"
      | "forged" = "normal",
  ) {
    const parent = probeParent(),
      store = createCriteriaToolbarStore<
        "search",
        S,
        CriteriaLocalCell<"search", S, string>
      >("search", (cell) => cell.createLocal<string>("draft"));
    const unmount = store.mount();
    store.commit(parent.input());
    const before = store.read();
    if (!before) throw new Error("Actual committed A required");
    const draft = before.cell.createLocal<{ value: string }>("draft");
    draft.write(before.actor, { value: "kept" });
    let fired = 0;
    const timer = before.cell.timeout(before.actor, 100000, () => {
      fired++;
      return undefined;
    });
    const snapshot = before.cell.getSnapshot(),
      version = store.getSnapshot();
    let armed = true;
    let bReads = 0;
    const replacement = new Proxy(
      { messages: { placeholder: "B" } },
      {
        getOwnPropertyDescriptor(target, key) {
          bReads++;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    const cfg = new Proxy(
      { messages: { placeholder: "A" } },
      {
        getOwnPropertyDescriptor(target, key) {
          gets++;
          if (armed) {
            armed = false;
            if (variant === "forged")
              throw new Error("Criteria facade layout skipped.");
            if (variant === "reset") f.app.reset();
            else if (variant === "reentry") store.commit(parent.input());
            else parent.publish(replacement);
            if (throwTrap) throw new Error("Synthetic descriptor throw");
          }
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    const input = parent.publish(cfg);
    if (variant === "malformed") {
      parent.publish({ messages: { label: 3 } });
      store.commit(parent.input());
    } else if (variant === "initial") {
      const child = createCriteriaCommitCell("search", f.app.C),
        lease = child.connect();
      try {
        child.commit(lease, parent.target, input);
      } catch {}
      const denied = child.getSnapshot().actor === null;
      child.disconnect(lease);
      unmount();
      parent.dispose();
      return { denied };
    } else store.commit(input);
    const after = store.read();
    const result = {
      sameActor: after?.actor === before.actor,
      sameSnapshot: before.cell.getSnapshot() === snapshot,
      sameHostVersion: store.getSnapshot() === version,
      draft: after ? draft.read(after.actor)?.value : null,
      deadline: timer.deadline,
      fired,
      denied: after === null,
      observed,
      bReads,
    };
    unmount();
    parent.dispose();
    return result;
  }
  return {
    render,
    state() {
      return {
        phase: model?.phase,
        ready: !!producer?.cell.getSnapshot().actor,
        gets,
        observed,
      };
    },
    show() {
      ui = true;
      render();
    },
    refresh() {
      if (!model) throw new Error("No model");
      render();
    },
    parentB() {
      publish({ ...config });
    },
    query() {
      f.app.change({
        type: "sorting.change",
        update: [{ id: "amount", desc: true }],
      });
      render();
    },
    selection() {
      f.app.change({ type: "selection.change", update: () => ({ one: true }) });
      render();
    },
    supersede,
    tickets() {
      const a = actual(),
        before = Object.fromEntries(
          Object.entries(a.p.sources).map(([key, source]) => [
            key,
            getCriteriaFacadeInput(source),
          ]),
        );
      publish({ ...config });
      const b = actual();
      return Object.entries(b.p.sources).every(
        ([key, source]) => getCriteriaFacadeInput(source) === before[key],
      );
    },
    unreadyCandidate() {
      suspend = true;
      config = new Proxy(config, {
        getOwnPropertyDescriptor() {
          gets++;
          throw new Error("Candidate parent reflection");
        },
      });
      render();
    },
    builder() {
      const a = actual(),
        source = a.p.sources.builder,
        input = getCriteriaFacadeInput(source),
        cell = createCriteriaCommitCell("builder", f.app.C),
        lease = cell.connect();
      try {
        const actor = cell.commit(lease, a.target, input),
          ports = cell.require(actor).ports;
        return {
          label: ports.fields.amount?.label,
          mode: ports.evaluationMode,
          operator: ports.fields.amount?.operatorLabels?.["number.gt"],
          registry: !!ports.registry,
        };
      } finally {
        cell.disconnect(lease);
      }
    },
    defaultsAndOwners() {
      const a = actual(),
        cell = createTableRendererCell(a.model),
        lease = cell.connect(),
        source = createCriteriaFacadeSource(cell, "builder");
      let bad = 0,
        bCalls = 0;
      const field = {
        label: "User amount",
        operatorLabels: { "number.gt": "User comparison" },
        formatValue() {
          if (this !== field) bad++;
          return this.label;
        },
      };
      const editor = {
        marker: "Actual dictionary receiver",
        formatRelative() {
          if (this !== editor) bad++;
          return this.marker;
        },
      };
      const cfg: NonNullable<TableRendererToolConfigs<S>["builder"]> = {
        evaluationMode: complete ? "server" : "client",
        fields: { amount: field, otherAmount: field },
        messages: { filters: "User filters" },
        dateMessages: editor,
        createRuleId() {
          if (this !== cfg) bad++;
          return "a-rule";
        },
      };
      let parentActor = cell.commit(lease, a.model, {
        locale: englishDataTableLocale,
        tools: { builder: cfg },
      });
      const inputA = publishCriteriaFacadeSource(source, {
        cell,
        actor: parentActor,
      });
      const child = createCriteriaCommitCell("builder", f.app.C),
        childLease = child.connect(),
        actorA = child.commit(childLease, a.target, inputA),
        ports = child.require(actorA).ports;
      const original = ports.createRuleId,
        format = ports.fields.amount?.formatValue;
      const result = {
        label: ports.fields.amount?.label,
        alias: ports.fields.amount === ports.fields.otherAmount,
        filters: ports.messages?.filters,
        custom: ports.fields.amount?.operatorLabels?.["number.gt"],
        builtin:
          ports.fields.amount?.operatorLabels?.["number.eq"] ===
          englishDataTableLocale.builtinOperatorLabels["number.eq"],
        format: format?.({
          id: "synthetic-rule",
          field: "amount",
          operator: "number.gt",
          value: 1,
        }),
        editor: ports.dateMessages?.formatRelative?.({
          kind: "relative",
          preset: "today",
        }),
        whileB: "",
        staleDenied: false,
        bad: 0,
        bCalls: 0,
      };
      const cfgB = {
        ...cfg,
        createRuleId() {
          bCalls++;
          return "b-rule";
        },
      };
      parentActor = cell.commit(lease, a.model, {
        locale: englishDataTableLocale,
        tools: { builder: cfgB },
      });
      const inputB = publishCriteriaFacadeSource(source, {
        cell,
        actor: parentActor,
      });
      result.whileB = original?.() ?? "";
      child.commit(childLease, a.target, inputB);
      try {
        original?.();
      } catch {
        result.staleDenied = true;
      }
      result.bad = bad;
      result.bCalls = bCalls;
      child.disconnect(childLease);
      cell.disconnect(lease);
      return result;
    },
    coalescing() {
      const a = actual(),
        parent = probeParent(),
        store = createCriteriaToolbarStore<
          "search",
          S,
          CriteriaLocalCell<"search", S, string>
        >("search", (cell) => cell.createLocal<string>("draft")),
        stop = store.mount();
      store.commit(parent.input());
      const old = store.read();
      if (!old) throw new Error("No actual child");
      const snapshot = old.cell.getSnapshot(),
        version = store.getSnapshot(),
        input = parent.input();
      const actor = parent.cell.commit(parent.lease, a.model, {
        ...config,
        tools: { search: { messages: { placeholder: "B" } } },
      });
      void actor; // no child publication yet
      const eligible = old.cell.require(old.actor).actor === old.actor;
      store.commit(input);
      const same =
        old.cell.getSnapshot() === snapshot && store.getSnapshot() === version;
      stop();
      parent.dispose();
      return { eligible, same };
    },
    receipts() {
      const parent = probeParent(),
        cell = createCriteriaCommitCell("search", f.app.C),
        lease = cell.connect();
      cell.commit(lease, parent.target, parent.input());
      let armed = true;
      const input = parent.publish(
          new Proxy(
            { messages: { label: "A" } },
            {
              getOwnPropertyDescriptor(target, key) {
                if (armed) {
                  armed = false;
                  parent.publish({ messages: { label: "B" } });
                }
                return Reflect.getOwnPropertyDescriptor(target, key);
              },
            },
          ),
        ),
        carrier = prepareCriteriaFacadeHost(input);
      let error: unknown;
      try {
        cell.commit(lease, parent.target, input);
      } catch (value) {
        error = value;
      }
      const foreign = prepareCriteriaFacadeHost(parent.input()),
        wrong = consumeCriteriaFacadeHostSkip(error, input, cell, foreign),
        first = consumeCriteriaFacadeHostSkip(error, input, cell, carrier),
        reused = consumeCriteriaFacadeHostSkip(error, input, cell, carrier);
      closeCriteriaFacadeHost(carrier);
      closeCriteriaFacadeHost(foreign);
      cell.disconnect(lease);
      parent.dispose();
      return { wrong, first, reused };
    },
    postBoundary() {
      const parent = probeParent(),
        cell = createCriteriaCommitCell("search", f.app.C),
        lease = cell.connect(),
        actor = cell.commit(lease, parent.target, parent.input());
      const original = globalThis.clearTimeout;
      let armed = false,
        cancels = 0,
        error: unknown;
      const stop: typeof globalThis.clearTimeout = (
        ...args: Parameters<typeof globalThis.clearTimeout>
      ) => {
        Reflect.apply(original, globalThis, args);
        cancels++;
        if (armed) {
          armed = false;
          parent.publish({ messages: { label: "After boundary" } });
          throw new Error("Synthetic native cancellation fault");
        }
      };
      globalThis.clearTimeout = stop;
      try {
        cell.timeout(actor, 100000, () => undefined);
        const input = parent.publish({ messages: { label: "Candidate" } }),
          carrier = prepareCriteriaFacadeHost(input);
        armed = true;
        try {
          cell.commit(lease, parent.target, input);
        } catch (value) {
          error = value;
        }
        const skip = consumeCriteriaFacadeHostSkip(error, input, cell, carrier);
        closeCriteriaFacadeHost(carrier);
        return { denied: cell.getSnapshot().actor === null, skip, cancels };
      } finally {
        globalThis.clearTimeout = original;
        cell.disconnect(lease);
        parent.dispose();
      }
    },
    purge() {
      const a = actual(),
        input = getCriteriaFacadeInput(a.p.sources.search),
        before = criteriaFacadeIdentity(input);
      f.app.reset();
      return {
        before: !!before,
        state: criteriaFacadeState(input),
        sameMetadata: criteriaFacadeIdentity(input) === before,
        actor: a.p.cell.getSnapshot().actor,
      };
    },
    unmount() {
      flushSync(() => root.unmount());
      node.remove();
      f.dispose();
    },
  };
}
const api = { client: mount(), complete: mount(true) };
declare global {
  interface Window {
    facadeSource: typeof api;
  }
}
window.facadeSource = api;
