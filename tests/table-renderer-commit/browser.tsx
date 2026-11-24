import {
  createCriteriaPublication,
  type DataTableModel,
  type DataTableOptions,
  requireDataTableModel,
  useDataTable,
} from "@tableweave/react";
import { StrictMode, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  type CriteriaActor,
  createCriteriaCommitCell,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import { createTableRendererCell } from "../../packages/heroui/src/table/renderer-commit.js";
import type {
  TableRendererActor,
  TableRendererCell,
  TableRendererConfig,
  TableRendererLease,
} from "../../packages/heroui/src/table/types.js";
import {
  type Fixture,
  fixture,
  type Item,
  records,
  type Schema,
} from "../table-facade/hook/fixtures.js";

type Model = DataTableModel<Schema, Item>;
type Actor = TableRendererActor<Schema, Item>;
type Config = TableRendererConfig<Schema, Item>;
function mount(
  f: Fixture,
  mode: "client" | "server" | "server-complete",
  id: string,
) {
  const container = document.createElement("div");
  container.id = id;
  document.body.append(container);
  const root = createRoot(container);
  let options = f.options(mode),
    model: Model | null = null,
    cell: TableRendererCell<Schema, Item> | null = null,
    lease: TableRendererLease<Schema, Item> | null = null;
  let actor: Actor | null = null,
    oldActor: Actor | null = null,
    oldModel: Model | null = null,
    saved: (() => unknown) | null = null;
  let calls = 0,
    candidateReads = 0,
    childReads = 0,
    messageReceiver = false,
    stateModelIsCurrent = false;
  let beforeVersion: object | null = null,
    beforeModelVersion: object | null = null,
    notify = 0;
  const config: Config & { tag: string } = {
    tag: "A",
    collection: {
      label: "Synthetic",
      rowHeaderColumnId: "amount",
      rowTextValue(row) {
        calls++;
        return row.original.title;
      },
      columnTextValue: (column) => column.id,
      cellTextValue: (value) => value.row.original.title,
    },
    renderState(context) {
      calls++;
      stateModelIsCurrent = context.model === model;
      return `${this.tag}:${context.model.state?.revision}`;
    },
    renderToolbar(context) {
      calls++;
      return context.defaultContent;
    },
    onRetry: () => {
      calls++;
    },
    messages: {
      collection: {
        selectedCount(count) {
          messageReceiver = this === config.messages?.collection;
          return String(count);
        },
      },
    },
    tools: {
      search: new Proxy(
        {},
        {
          get() {
            childReads++;
            throw 0;
          },
          getOwnPropertyDescriptor() {
            childReads++;
            throw 0;
          },
        },
      ),
    },
    actions: [
      {
        id: "synthetic",
        label: "Synthetic",
        onAction(context) {
          calls++;
          if (context.loadedSelected[0])
            void context.loadedSelected[0].record.amount;
        },
      },
    ],
  };
  let pendingResolve: (() => void) | null = null,
    pending: Promise<void> | null = null;
  const draftFactory = (value: TableRendererCell<Schema, Item>) =>
    value.createLocal<{ text: string }>("draft");
  let draft: ReturnType<typeof draftFactory> | null = null;
  let child: ReturnType<
    typeof createCriteriaCommitCell<"search", Schema>
  > | null = null;
  let childActor: CriteriaActor<"search", Schema> | null = null;
  function View() {
    const next = useDataTable(f.D, options);
    const [owned] = useState(() => createTableRendererCell(next));
    useLayoutEffect(() => {
      cell = owned;
      const mounted = owned.connect();
      lease = mounted;
      draft ??= draftFactory(owned);
      const stop = owned.subscribe(() => {
        notify++;
      });
      return () => {
        stop();
        owned.disconnect(mounted);
        if (lease === mounted) lease = null;
      };
    }, [owned]);
    useLayoutEffect(() => {
      try {
        requireDataTableModel(next, f.D);
        if (!next.sourceTarget) return;
        if (owned.getSnapshot().actor && lease) owned.updateModel(lease, next);
        model = next;
      } catch {
        /* Same-domain stale model waits for actual P2 commit, no purge/remount. */
      }
    }, [next, owned]);
    return <output>{next.phase}</output>;
  }
  function render() {
    root.render(
      <StrictMode>
        <View />
      </StrictMode>,
    );
  }
  const requireSetup = () => {
    if (!cell || !lease || !model)
      throw new Error("Actual committed model/lease missing");
    return { cell, lease, model };
  };
  render();
  let p2Model: Model | null = null;
  return {
    commitA() {
      const data = requireSetup();
      actor = data.cell.commit(data.lease, data.model, config);
      oldActor = actor;
      oldModel = data.model;
      const captured = data.cell.require(actor).ports.renderState;
      const metadata = data.model.metadata;
      if (!metadata) throw 0;
      saved = () =>
        captured?.({
          model: data.model,
          metadata,
          recovery: data.model.recovery,
        });
      draft?.write(actor, { text: "kept" });
      beforeVersion = data.cell.getSnapshot().version;
      beforeModelVersion = data.cell.getSnapshot().modelVersion;
    },
    invoke() {
      const data = requireSetup();
      const metadata = data.model.metadata;
      if (!actor || !metadata) throw 0;
      return data.cell.require(actor).ports.renderState?.({
        model: data.model,
        metadata,
        recovery: data.model.recovery,
      });
    },
    row() {
      const data = requireSetup();
      if (!actor || !data.model.view?.rows[0]) throw 0;
      return data.cell
        .require(actor)
        .ports.collection?.rowTextValue(data.model.view.rows[0]);
    },
    message() {
      const data = requireSetup();
      if (!actor) throw 0;
      return data.cell
        .require(actor)
        .ports.messages.collection?.selectedCount?.(1);
    },
    commitB() {
      const data = requireSetup();
      actor = data.cell.commit(data.lease, data.model, {
        ...config,
        renderState: () => {
          calls++;
          return "B";
        },
      });
    },
    candidateOnly() {
      return (
        Object.defineProperty({}, "renderState", {
          get() {
            candidateReads++;
            throw 0;
          },
        }) && true
      );
    },
    badActualCommit() {
      const data = requireSetup();
      const input = Object.defineProperty({}, "renderState", {
        get() {
          candidateReads++;
          throw 0;
        },
      });
      try {
        data.cell.commit(data.lease, data.model, input);
      } catch {
        /* actual invalid capture purges */
      }
    },
    refresh() {
      f.app.change({ type: "selection.change", update: { r1: true } });
    },
    query() {
      f.app.change({ type: "search.commit", search: "Synthetic" });
    },
    rejectCopy() {
      const data = requireSetup();
      let denied = false;
      try {
        data.cell.updateModel(data.lease, { ...data.model });
      } catch {
        denied = true;
      }
      return denied;
    },
    reentry() {
      const data = requireSetup();
      const input = new Proxy(
        {},
        {
          getOwnPropertyDescriptor() {
            f.app.reset();
            return undefined;
          },
        },
      );
      try {
        data.cell.commit(data.lease, data.model, input);
      } catch {
        /* revoked in captured reflection */
      }
    },
    oldSavedDenied() {
      try {
        saved?.();
        return false;
      } catch {
        return true;
      }
    },
    sourceOnlyRowsDenied() {
      try {
        const data = requireSetup();
        if (!actor) throw 0;
        const current = data.cell.require(actor);
        current.ports.collection?.rowTextValue(records[0] as never);
        return false;
      } catch {
        return true;
      }
    },
    retry() {
      const data = requireSetup();
      if (!actor) throw 0;
      return data.cell.require(actor).ports.onRetry?.();
    },
    startAsync() {
      const data = requireSetup();
      actor = data.cell.commit(data.lease, data.model, {
        onRetry: () =>
          new Promise<void>((resolve) => {
            pendingResolve = resolve;
            calls++;
          }),
      });
      pending = data.cell.require(actor).ports.onRetry?.() ?? null;
      pending?.catch(() => {});
    },
    async resolveAsync() {
      pendingResolve?.();
      try {
        await pending;
        return "resolved";
      } catch {
        return "denied";
      }
    },
    startChild() {
      const data = requireSetup(),
        target = data.model.toolTarget;
      if (!target) throw 0;
      child = createCriteriaCommitCell("search", f.app.C);
      const localLease = child.connect();
      childActor = child.commit(localLease, target, {
        controller: f.app.C,
        expectedContext: f.context,
        onMutation: () => {
          calls++;
        },
      });
    },
    childAlive() {
      if (!child || !childActor) throw 0;
      try {
        child.require(childActor).ports.onMutation?.({ status: "noop" });
        return true;
      } catch {
        return false;
      }
    },
    work() {
      const data = requireSetup();
      if (!actor) throw 0;
      data.cell.timeout(actor, 50, () => {
        calls++;
        return undefined;
      });
    },
    reset() {
      const result = f.app.reset();
      f.app.P.complete(result.ticket);
      options = f.options(mode);
      actor = null;
      render();
    },
    denySource() {
      f.resource.setContext({ ...f.context, access: false });
    },
    createP2() {
      f.app.reset();
      if (f.app.P.dispose().status !== "disposed") throw 0;
      const before = f.app.C.getSnapshot();
      let ticket: object | null = null;
      const publication = createCriteriaPublication({
        controller: f.app.C,
        definition: f.app.CD,
        retirement: {
          retire(event) {
            if (
              !ticket ||
              event.kind !== "transition" ||
              event.controller !== f.app.C ||
              event.definition !== f.app.CD ||
              f.app.pending ||
              f.app.C.getSnapshot() !== before ||
              Object.keys(before.selection).length ||
              publication.getSnapshot().pending !== event.next
            )
              throw new Error(
                "Actual retired P1 bootstrap certificate missing",
              );
            return undefined;
          },
        },
      });
      const begun = publication.begin({
        controller: f.app.C,
        definition: f.app.CD,
        expected: f.context,
        actual: f.context,
      });
      if (begun.status !== "pending") throw 0;
      ticket = begun.ticket;
      if (publication.complete(begun.ticket).status !== "settled") throw 0;
      const current = publication.getSnapshot().current;
      if (!current) throw 0;
      const input: DataTableOptions<Schema, Item> = {
        controller: f.app.C,
        publication,
        criteria: publication.issue({
          controller: f.app.C,
          definition: f.app.CD,
          context: f.context,
          epoch: current.epoch,
        }),
        expected: f.context,
        source: { mode: "client", context: f.context, records },
      };
      const host = document.createElement("div");
      document.body.append(host);
      function P2() {
        const model = useDataTable(f.D, input);
        useLayoutEffect(() => {
          try {
            requireDataTableModel(model, f.D);
            if (model.sourceTarget) p2Model = model;
          } catch {
            /* next actual commit */
          }
        }, [model]);
        return null;
      }
      createRoot(host).render(<P2 />);
    },
    rejectP2() {
      const data = requireSetup();
      if (!p2Model) throw 0;
      const input = Object.defineProperty({}, "renderState", {
        get() {
          candidateReads++;
          throw 0;
        },
      });
      try {
        data.cell.commit(data.lease, p2Model, input);
        return false;
      } catch {
        return true;
      }
    },
    state() {
      const snapshot = cell?.getSnapshot();
      let valid = false,
        oldModelDenied = false,
        value: string | null = null;
      if (actor && cell)
        try {
          cell.require(actor);
          valid = true;
          value = draft?.read(actor)?.text ?? null;
        } catch {
          /* denied */
        }
      if (oldModel)
        try {
          requireDataTableModel(oldModel, f.D);
        } catch {
          oldModelDenied = true;
        }
      return {
        phase: model?.phase ?? null,
        valid,
        calls,
        candidateReads,
        childReads,
        messageReceiver,
        stateModelIsCurrent,
        draft: value,
        oldModelDenied,
        sameActor: snapshot?.actor === oldActor,
        configUnchanged: snapshot?.version === beforeVersion,
        metadataChanged: snapshot?.modelVersion !== beforeModelVersion,
        notify,
        modelRevision: model?.state?.revision,
        p2Ready: p2Model !== null,
        hasTool: !!model?.toolTarget,
      };
    },
    disconnect() {
      root.unmount();
    },
  };
}
const f = fixture();
f.app.settle();
const fail = fixture();
fail.app.settle();
const failed = fail.start(() => {});
fail.resource.fail(failed.request, "offline");
const api = {
  display: mount(f, "client", "display"),
  failure: mount(fail, "server", "failure"),
};
declare global {
  interface Window {
    rendererCommit: typeof api;
  }
}
window.rendererCommit = api;
