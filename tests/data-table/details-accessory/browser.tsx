import {
  type DataTableModel,
  requireDataTableModel,
  useDataTable,
} from "@tableweave/react";
import { StrictMode, Suspense, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  getDetailsAccessoryOwner,
  getDetailsBinding,
} from "../../../packages/heroui/src/data-table/details-binding.js";
import {
  DetailsProvider,
  RecordDetails,
  useDetailsAccessory,
} from "../../../packages/heroui/src/data-table/details-provider.js";
import { createDetailsCommitCell } from "../../../packages/heroui/src/details/committed-details.js";
import {
  getAdoptedDetailsSessionOwner,
  getDetailsSessionOwner,
} from "../../../packages/heroui/src/details/session-identity.js";
import type {
  DetailsAccessory,
  DetailsAccessoryOptions,
  DetailsOutcome,
  DetailsRenderContext,
  DetailsSession,
} from "../../../packages/heroui/src/details/types.js";
import {
  useBoundDetailsSession,
  useDetailsSession,
} from "../../../packages/heroui/src/details/use-details-session.js";
import { NativeCollection } from "../../../packages/heroui/src/table/native-collection.js";
import { fixture, type Item, type Schema } from "./fixtures.js";
import "../../../apps/storybook/src/styles.css";

function Form({ context }: { context: DetailsRenderContext<Schema, Item> }) {
  const [draft, setDraft] = useState(context.record?.title ?? "");
  return (
    <form data-form>
      <label>
        Controlled draft
        <input
          aria-label="Controlled draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <label>
        Uncontrolled draft
        <input
          aria-label="Uncontrolled draft"
          defaultValue={context.record?.title ?? ""}
        />
      </label>
      <output data-row>{context.row ? "actual row" : "no row"}</output>
      <output data-status>{context.status}</output>
    </form>
  );
}
function mount(remote = false, unselectable = false) {
  const f = fixture(unselectable);
  let candidate: DetailsAccessoryOptions<Schema, Item> | null = null,
    suspended = false,
    descriptorReads = 0,
    probe = false,
    direction: "ltr" | "rtl" = "ltr";
  let actualBound: DetailsSession<Schema, Item> | null = null,
    actualLegacy: DetailsSession<Schema, Item> | null = null;
  let saved: (() => Promise<DetailsOutcome<Schema>>) | null = null,
    savedRetry: (() => Promise<string>) | null = null;
  const never = new Promise<never>(() => {});
  let model: DataTableModel<Schema, Item> | null = null,
    accessory: DetailsAccessory<Schema, Item> | null = null;
  const node = document.createElement("section");
  document.body.append(node);
  const root = createRoot(node);
  f.setBody((context) => {
    f.counters.body++;
    return <Form context={context} />;
  });
  const body = f.options().renderBody;
  function Probes({ details }: { details: DetailsAccessory<Schema, Item> }) {
    actualBound = useBoundDetailsSession(details);
    actualLegacy = useDetailsSession({
      ...f.options(),
      controller: f.app.C,
      visibleFieldIds: ["title"],
      hiddenFieldIds: [],
    });
    return null;
  }
  function Root() {
    const table = useDataTable(f.D, f.modelOptions(remote));
    model = table;
    const details = useDetailsAccessory(table, candidate ?? f.options());
    accessory = details;
    if (suspended) throw never;
    let ready = false;
    try {
      requireDataTableModel(table, f.D);
      ready = !!table.view && !!table.presentation && !!table.authority;
    } catch {
      /* Uncommitted. */
    }
    return (
      <DetailsProvider accessory={details} direction={direction}>
        {ready && table.view && table.presentation && table.authority ? (
          <NativeCollection
            view={table.view}
            controls={{
              definition: f.D.native,
              presentation: table.presentation,
              authority: table.authority,
            }}
            label="Synthetic records"
            rowHeaderColumnId="title"
            columnTextValue={(column) => column.id}
            rowTextValue={(row) => row.original.title}
            cellTextValue={(cell) => String(cell.getValue())}
            diagnostics={false}
          />
        ) : (
          <p>Waiting for actual frame</p>
        )}
        <RecordDetails accessory={details} />
        {probe ? <Probes details={details} /> : null}
      </DetailsProvider>
    );
  }
  const render = () =>
    flushSync(() =>
      root.render(
        <StrictMode>
          <Suspense fallback={<p>Suspended candidate</p>}>
            <Root />
          </Suspense>
        </StrictMode>,
      ),
    );
  render();
  const binding = () => {
    if (!accessory) throw new Error("No actual accessory");
    return getDetailsBinding(accessory);
  };
  return {
    render,
    actualModel: () => model,
    state() {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      return {
        phase: model?.phase,
        owner: !!(accessory && getDetailsAccessoryOwner(accessory)),
        ports: actor ? b.cell.require(actor).ports !== null : false,
        body: f.counters.body,
        read: f.counters.read,
        counters: { ...f.counters },
        rowId: f.app.C.getSnapshot().details.rowId,
        descriptorReads,
        authority: f.authority(),
      };
    },
    identity() {
      if (!accessory) return false;
      return (
        getDetailsAccessoryOwner(new Proxy(accessory, {})) === null &&
        getDetailsAccessoryOwner({ ...accessory }) === null
      );
    },
    dirty(value: boolean) {
      f.setDirty(value);
    },
    controlled(value: boolean) {
      f.setAutoAccept(!value);
    },
    accept() {
      f.accept();
      render();
    },
    reject() {
      f.reject();
      render();
    },
    programmatic(id: string) {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (actor) void b.request(actor, id, "programmatic");
    },
    error() {
      f.error();
      render();
    },
    deferRetry() {
      f.deferRetry();
    },
    resolveRetry() {
      f.resolveRetry();
    },
    saveRetry() {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (!actor) throw new Error("No actor");
      savedRetry = () => b.retry(actor);
    },
    callSavedRetry() {
      return savedRetry?.() ?? Promise.resolve("missing");
    },
    sessionABA() {
      f.sessionABA();
      render();
    },
    accessLoss() {
      f.accessLoss();
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (actor) b.readSession(actor);
      return b.cell.getSnapshot().actor === null;
    },
    rtl() {
      direction = "rtl";
      render();
    },
    probeSessions() {
      probe = true;
      render();
    },
    sessionIdentity() {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (!actor || !actualBound || !actualLegacy)
        throw new Error("Actual hook views required");
      let trapReads = 0;
      const proxy = new Proxy(actualBound, {
        get() {
          trapReads++;
          throw new Error("Alleged session");
        },
        getPrototypeOf() {
          trapReads++;
          throw new Error("Alleged session");
        },
        getOwnPropertyDescriptor() {
          trapReads++;
          throw new Error("Alleged session");
        },
      });
      let denied = 0;
      for (const value of [actualLegacy, {}, proxy])
        try {
          Reflect.apply(b.requireSession, b, [actor, value]);
        } catch {
          denied++;
        }
      b.requireSession(actor, actualBound);
      return {
        legacy: getDetailsSessionOwner(actualLegacy)?.mode,
        adopted: getAdoptedDetailsSessionOwner(actualBound)?.mode,
        denied,
        trapReads,
      };
    },
    poison(suspend = false) {
      candidate = new Proxy(f.options(), {
        getOwnPropertyDescriptor() {
          descriptorReads++;
          throw new Error("Candidate options were inspected");
        },
      });
      suspended = suspend;
      render();
    },
    recover() {
      candidate = null;
      suspended = false;
      render();
    },
    waiting() {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (!actor) throw new Error("No actor");
      const key = b.readSession(actor).contentKey,
        held = b.held(actor, key),
        reads = f.counters.read,
        bodyCalls = f.counters.body;
      f.app.change({ type: "search.commit", search: "Synthetic" });
      const view = b.readSession(actor);
      return {
        waiting: view.isOpen && view.context === null,
        sameHeld: b.held(actor, key) === held && held !== null,
        readDelta: f.counters.read - reads,
        bodyDelta: f.counters.body - bodyCalls,
      };
    },
    coreProbe() {
      if (!model) throw new Error("No real P2 model");
      const cell = createDetailsCommitCell(model),
        local = cell.createLocal<{ marker: string }>("draft");
      const l1 = cell.connect();
      cell.commit(l1, model, f.options());
      cell.disconnect(l1);
      const l2 = cell.connect(),
        actor = cell.commit(l2, model, f.options());
      local.write(actor, { marker: "real local" });
      cell.disconnect(l1);
      const staleLeaseSafe = local.read(actor)?.marker === "real local";
      const before = { ...f.counters };
      f.app.reset();
      let denied = false;
      try {
        local.read(actor);
      } catch {
        denied = true;
      }
      const noPrivateCallbacks = Object.keys(before).every(
        (key) => Reflect.get(before, key) === Reflect.get(f.counters, key),
      );
      const purged = cell.getSnapshot().actor === null;
      cell.disconnect(l2);
      const cleanup = f.app.change({
        type: "details.change",
        update: () => ({ rowId: null }),
      });
      return {
        staleLeaseSafe,
        denied,
        purged,
        noPrivateCallbacks,
        controllerAlive: !f.app.C.isDisposed(),
        bareCleanup: cleanup.status,
      };
    },
    resolve(value: boolean) {
      f.resolve(value);
    },
    configB() {
      f.optionsB();
      f.setBody(body);
      render();
    },
    refresh() {
      f.refresh();
      f.setBody(body);
      render();
    },
    selection() {
      f.app.change({ type: "selection.cancel" });
      render();
    },
    query() {
      f.app.change({ type: "search.commit", search: "Synthetic" });
      render();
    },
    close() {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (actor) void b.request(actor, null, "programmatic");
    },
    closeThenOpen() {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (!actor) throw new Error("No actor");
      void b.request(actor, null, "programmatic");
      render();
      f.app.change({
        type: "details.change",
        update: () => ({ rowId: "two" }),
      });
      render();
    },
    offpage() {
      f.app.change({
        type: "pagination.change",
        update: (previous) => ({ ...previous, pageIndex: 1 }),
      });
      render();
    },
    rows() {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (!actor) return false;
      try {
        b.requireRow(actor, "not-loaded");
        return false;
      } catch {
        return true;
      }
    },
    reset() {
      f.app.reset();
    },
    save() {
      const b = binding(),
        actor = b.cell.getSnapshot().actor;
      if (!actor) throw new Error("No actor");
      saved = () => b.request(actor, null, "programmatic");
    },
    callSaved() {
      return saved?.() ?? Promise.resolve({ status: "failed" } as const);
    },
    foreignModel(foreign: DataTableModel<Schema, Item>) {
      if (!model) throw new Error("No model");
      const cell = createDetailsCommitCell(model),
        lease = cell.connect();
      cell.commit(lease, model, f.options());
      let denied = false;
      try {
        cell.updateModel(lease, foreign);
      } catch {
        denied = true;
      } finally {
        cell.disconnect(lease);
      }
      return denied;
    },
    sessionChecks(session: Parameters<typeof getDetailsSessionOwner>[0]) {
      return {
        legacy: !!getDetailsSessionOwner(session),
        adopted: !!getAdoptedDetailsSessionOwner(session),
      };
    },
    unmount() {
      flushSync(() => root.unmount());
      node.remove();
      f.dispose();
    },
  };
}
let other: ReturnType<typeof mount> | null = null;
const api = {
  client: mount(),
  sourceOnly: mount(true),
  mountOther() {
    other ??= mount(false, true);
    return true;
  },
  foreign() {
    const foreign = other?.actualModel();
    if (!foreign) throw new Error("No foreign actual model");
    return api.client.foreignModel(foreign);
  },
};
declare global {
  interface Window {
    boundDetails: typeof api;
  }
}
window.boundDetails = api;
