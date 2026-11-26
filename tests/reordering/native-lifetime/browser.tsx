import { Table } from "@heroui/react/table";
import { Button } from "@heroui/react/button";
import {
  type DataTableModel,
  requireDataTableModel,
  useDataTable,
} from "@tableweave/react";
import { StrictMode, Suspense, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  issueNativeScope,
  issueNativeRow,
  issueNativeLeaf,
  issueNativeRowHandle,
  issueNativeLeafHandle,
  nativeScopeRef,
  nativeRowRef,
  nativeLeafRef,
  nativeHandleRef,
  nativeRefStatus,
  sealNativeRefs,
} from "../../../packages/heroui/src/table/native-resource-lifetime.js";
import { TableRendererNativeContent } from "../../../packages/heroui/src/table/renderer-collection.js";
import {
  createDataTableRendererCell,
  requireTableRendererTarget,
} from "../../../packages/heroui/src/table/renderer-commit.js";
import type {
  TableRendererActor,
  TableRendererCell,
  TableRendererConfig,
  TableRendererLease,
  TableRendererTarget,
} from "../../../packages/heroui/src/table/types.js";
import { fixture, type Item, type S } from "../../data-table/shell/fixtures.js";

type Model = DataTableModel<S, Item>;
type Cell = TableRendererCell<S, Item>;
type Target = TableRendererTarget<S, Item>;
type RowTicket = ReturnType<typeof issueNativeRow<S, Item>>;
const required = <T,>(value: T | null | undefined): T => {
  if (value == null) throw Error("Actual fixture value missing");
  return value;
};

// Genuine upstream compounds fed by the existing native view. This is a ref-
// primitive fixture, NOT NativeCollection/DataTable integration or a new engine.
function harness(
  id: string,
  shared?: ReturnType<typeof fixture>,
  server = false,
) {
  const f = shared ?? fixture(false, true);
  if (server) {
    f.remote();
    f.start();
    f.succeed();
  }
  const container = document.createElement("div");
  container.id = id;
  document.body.append(container);
  const root = createRoot(container);
  let model: Model | null = null,
    cell: Cell | null = null,
    lease: TableRendererLease<S, Item> | null = null;
  let actor: TableRendererActor<S, Item> | null = null,
    target: Target | null = null;
  let setTarget: ((target: Target) => void) | null = null;
  let setOptions: ((options: ReturnType<typeof f.options>) => void) | null =
    null;
  let repaint: (() => void) | null = null;
  let rowTicket: RowTicket | null = null,
    savedRowRef: ReturnType<typeof nativeRowRef<S, Item>> | null = null;
  let retiredTicket: RowTicket | null = null;
  let obsoleteRef: ReturnType<typeof nativeRowRef<S, Item>> | null = null;
  let obsoleteNode: HTMLTableRowElement | null = null;
  let comparison: { model: Model; ticket: RowTicket | null } | null = null;
  let savedNode: HTMLTableRowElement | null = null;
  let savedAction: (() => unknown) | null = null;
  let seal = "unmounted",
    refreshes = 0,
    calls = 0,
    suspend = false;
  let resolve: (() => void) | null = null;
  const pending = new Promise<void>((done) => {
    resolve = done;
  });
  const config: TableRendererConfig<S, Item> = {
    collection: f.collection,
    renderState: () => {
      calls++;
      return "A";
    },
  };
  function Probe({ value }: { readonly value: Target }) {
    const [revision, setRevision] = useState(0);
    repaint = () => setRevision((current) => current + 1);
    let committed: ReturnType<
      typeof requireTableRendererTarget<S, Item>
    > | null = null;
    try {
      committed = requireTableRendererTarget(value);
    } catch {
      /* No fabricated display. */
    }
    const frame = committed?.model.frame;
    useLayoutEffect(() => {
      if (!frame || suspend) return;
      seal = sealNativeRefs(value);
      if (seal === "refresh-refs" && refreshes++ < 1)
        setRevision((current) => current + 1);
    }, [value, revision, frame]);
    if (suspend) throw pending;
    if (!committed) return <output>waiting</output>;
    const current = committed;
    const view = required(committed.model.view);
    const column = required(
      view.visibleColumns.find((item) => item.id === "details"),
    );
    const scope = issueNativeScope(value, column);
    const rows = view.rows.map((row) => {
      const ticket = issueNativeRow(value, row);
      const cell = required(
        row.getVisibleCells().find((item) => item.column.id === column.id),
      );
      const handle = issueNativeRowHandle(value, ticket, cell);
      if (row.id === view.rows[0]?.id) {
        rowTicket = ticket;
        savedRowRef = nativeRowRef(ticket);
      }
      return { row, ticket, handle };
    });
    const headers = view.headerGroups
      .flatMap((group) => group.headers)
      .filter(
        (header) => !header.isPlaceholder && header.subHeaders.length === 0,
      )
      .map((header) => {
        const policy = f.D.native.controllerDefinition.columns.find(
          (item) => item.id === header.column.id,
        );
        if (policy?.utility || header.column.id === "select")
          return { header, ticket: null, handle: null };
        const ticket = issueNativeLeaf(value, header);
        return { header, ticket, handle: issueNativeLeafHandle(value, ticket) };
      });
    return (
      <Table>
        <Table.Content
          aria-label={`Actual native refs ${id}`}
          ref={nativeScopeRef(scope)}
        >
          <Table.Header>
            {headers.map(({ header, ticket, handle }) => (
              <Table.Column
                key={header.column.id}
                id={header.column.id}
                textValue={header.column.id}
                isRowHeader={header.column.id === "title"}
                ref={ticket ? nativeLeafRef(ticket) : undefined}
                data-column-id={header.column.id}
                focusMode="child"
              >
                {handle ? (
                  <Button
                    slot={null}
                    ref={nativeHandleRef(handle)}
                    onPress={() => {
                      current.model.authority?.require({ type: "columns" });
                    }}
                  >
                    Column command probe
                  </Button>
                ) : null}
                <TableRendererNativeContent target={value} header={header} />
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {rows.map(({ row, ticket, handle }) => (
              <Table.Row
                key={row.id}
                id={row.id}
                textValue={row.id}
                ref={nativeRowRef(ticket)}
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    key={cell.column.id}
                    id={JSON.stringify([row.id, cell.column.id])}
                    textValue={`${row.id}:${cell.column.id}`}
                    data-column-id={cell.column.id}
                    focusMode="child"
                  >
                    {cell.column.id === column.id ? (
                      <Button
                        slot={null}
                        ref={nativeHandleRef(handle)}
                        onPress={() => {
                          current.model.authority?.require({
                            type: "reorder",
                            ids: [row.id],
                          });
                        }}
                      >
                        Row command probe
                      </Button>
                    ) : null}
                    <TableRendererNativeContent target={value} cell={cell} />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table>
    );
  }
  function View() {
    const [options, updateOptions] = useState(f.options);
    setOptions = updateOptions;
    const next = useDataTable(f.D, options);
    const [owned] = useState(() => createDataTableRendererCell(next));
    const [active, updateTarget] = useState<Target | null>(null);
    setTarget = updateTarget;
    useLayoutEffect(() => {
      cell = owned;
      const mounted = owned.connect();
      lease = mounted;
      return () => {
        owned.disconnect(mounted);
        if (lease === mounted) lease = null;
      };
    }, [owned]);
    useLayoutEffect(() => {
      try {
        requireDataTableModel(next, f.D);
        if (!next.sourceTarget || !lease) return;
        model = next;
        if (owned.getSnapshot().actor) owned.updateModel(lease, next);
        else {
          actor = owned.commit(lease, next, config);
          target = { cell: owned, actor };
          updateTarget(target);
          const ports = owned.require(actor).ports;
          const captured = ports.renderState;
          savedAction = () =>
            captured?.({
              model: next,
              metadata: required(next.metadata),
              recovery: next.recovery,
            });
        }
      } catch {
        /* Actual source-only/uncommitted model waits, never fake readiness. */
      }
    }, [next, owned]);
    return (
      <Suspense fallback={<output>Suspended</output>}>
        {active ? <Probe value={active} /> : <output>{next.phase}</output>}
      </Suspense>
    );
  }
  root.render(
    <StrictMode>
      <View />
    </StrictMode>,
  );
  const setup = () => ({
    model: required(model),
    cell: required(cell),
    lease: required(lease),
    target: required(target),
    actor: required(actor),
  });
  return {
    f,
    snapshot() {
      return {
        ready: seal === "ready" && nativeRefStatus(rowTicket) === "sealed",
        seal,
        refreshes,
        row: nativeRefStatus(rowTicket),
        calls,
        phase: model?.phase ?? null,
        retired: nativeRefStatus(retiredTicket),
        hidden: model?.state?.columns.visibility.amount === false,
        modelRefreshed: !!comparison && comparison.model !== model,
        frameSame: !!comparison && comparison.model.frame === model?.frame,
        ticketSame: !!comparison && comparison.ticket === rowTicket,
      };
    },
    callbackB() {
      const current = setup();
      const captured = current.cell.require(current.actor).ports.renderState;
      savedAction = () =>
        captured?.({
          model: current.model,
          metadata: required(current.model.metadata),
          recovery: current.model.recovery,
        });
      const beforeAllowed = savedAction() === "A";
      savedNode = container.querySelector("tbody tr"); // Test assertion only, never registry discovery.
      actor = current.cell.commit(current.lease, current.model, {
        ...config,
        renderState: () => {
          calls++;
          return "B";
        },
      });
      target = { cell: current.cell, actor };
      required(setTarget)(target);
      let denied = false;
      try {
        savedAction?.();
      } catch {
        denied = true;
      }
      return {
        beforeAllowed,
        denied,
        sameNode: savedNode === container.querySelector("tbody tr"),
        row: nativeRefStatus(rowTicket),
      };
    },
    releaseAndReplay() {
      savedNode = required(
        container.querySelector<HTMLTableRowElement>("tbody tr"),
      );
      const callback = required(savedRowRef);
      callback(null);
      let threw = false;
      try {
        callback(savedNode);
      } catch {
        threw = true;
      }
      const current = setup();
      const first = sealNativeRefs(current.target),
        second = sealNativeRefs(current.target);
      return { threw, row: nativeRefStatus(rowTicket), first, second };
    },
    fresh() {
      rowTicket = null;
      savedRowRef = null;
      required(repaint)();
    },
    cleanupRoundTrip() {
      const current = setup();
      const row = required(current.model.view?.rows[0]);
      const node = required(
        container.querySelector<HTMLTableRowElement>("tbody tr"),
      );
      const old = required(savedRowRef);
      const cleanup = old(node);
      if (typeof cleanup !== "function") throw Error("Actual cleanup missing");
      cleanup();
      const replacement = issueNativeRow(current.target, row);
      nativeRowRef(replacement)(node);
      const before = nativeRefStatus(replacement);
      old(null);
      cleanup();
      old(node);
      return { before, after: nativeRefStatus(replacement) };
    },
    sameModelUpdate() {
      const current = setup();
      const ticket = required(rowTicket);
      current.cell.updateModel(current.lease, current.model);
      const again = issueNativeRow(
        current.target,
        required(current.model.view?.rows[0]),
      );
      return { same: ticket === again, phase: nativeRefStatus(ticket) };
    },
    failClosed(kind: "config" | "model") {
      const current = setup();
      let reads = 0;
      const bad = new Proxy(
        {},
        {
          get() {
            reads++;
            throw Error("alleged model");
          },
        },
      );
      const config = Object.defineProperty({}, "renderState", {
        get() {
          reads++;
          throw Error("alleged config");
        },
      });
      try {
        if (kind === "model")
          current.cell.updateModel(current.lease, bad as never);
        else current.cell.commit(current.lease, current.model, config);
      } catch {
        /* Expected genuine-core failure, not a fake allowed frame. */
      }
      return {
        reads,
        ended: nativeRefStatus(rowTicket),
        actorNull: current.cell.getSnapshot().actor === null,
      };
    },
    sourceABA() {
      obsoleteRef = savedRowRef;
      obsoleteNode = required(
        container.querySelector<HTMLTableRowElement>("tbody tr"),
      );
      const pending = f.app.reset();
      f.app.P.complete(pending.ticket);
      required(setOptions)(f.options());
    },
    replayObsolete() {
      const callback = required(obsoleteRef);
      callback(required(obsoleteNode));
      callback(null);
      return nativeRefStatus(rowTicket);
    },
    serverWait() {
      retiredTicket = rowTicket;
      f.app.change({
        type: "sorting.change",
        update: [{ id: "title", desc: true }],
      });
      f.start();
      required(setOptions)(f.options());
    },
    serverReady() {
      f.succeed();
      required(setOptions)(f.options());
    },
    badParent() {
      const current = setup();
      required(savedRowRef)(null);
      const ticket = issueNativeRow(
        current.target,
        required(current.model.view?.rows[0]),
      );
      // Deliberately detached genuine DOM is a DENIAL fixture only. It is not
      // used as evidence of real collection/parent/ref acceptance.
      const node = document.createElement("tr");
      nativeRowRef(ticket)(node);
      const first = sealNativeRefs(current.target);
      const seal =
        first === "refresh-refs" ? sealNativeRefs(current.target) : first;
      return { seal, phase: nativeRefStatus(ticket) };
    },
    missingDesignation() {
      const current = setup();
      const view = required(current.model.view);
      const row = required(view.rows[0]);
      const ticket = issueNativeRow(current.target, row);
      const wrong = required(
        row.getVisibleCells().find((cell) => cell.column.id === "title"),
      );
      try {
        issueNativeRowHandle(current.target, ticket, wrong);
        return false;
      } catch {
        return true;
      }
    },
    replaceFrame() {
      retiredTicket = rowTicket;
      f.app.change({
        type: "columns.visibility",
        update: { amount: false },
      });
      required(setOptions)(f.options());
      return nativeRefStatus(retiredTicket);
    },
    sourceMode() {
      f.remote();
      f.start();
      f.succeed();
      required(setOptions)(f.options());
    },
    remount() {
      const current = setup();
      current.cell.disconnect(current.lease);
      lease = current.cell.connect();
      actor = current.cell.commit(lease, current.model, config);
      target = { cell: current.cell, actor };
      current.cell.disconnect(current.lease); // Old lease cannot disconnect B.
      required(setTarget)(target);
      let oldDenied = false;
      try {
        current.cell.require(current.actor);
      } catch {
        oldDenied = true;
      }
      return oldDenied;
    },
    nativeCancelReentry() {
      const current = setup();
      const original = globalThis.cancelAnimationFrame;
      let denied = 0;
      let runs = 0;
      globalThis.cancelAnimationFrame = (handle) => {
        const attempts = [
          () => current.cell.connect(),
          () => current.cell.commit(current.lease, current.model, config),
          () => current.cell.updateModel(current.lease, current.model),
          () => current.cell.timeout(current.actor, 0, () => undefined),
        ];
        for (const attempt of attempts) {
          try {
            attempt();
          } catch {
            denied++;
          }
        }
        original(handle);
      };
      try {
        current.cell.animationFrame(current.actor, () => {
          runs++;
          return undefined;
        });
        current.cell.disconnect(current.lease);
        return { denied, runs, row: nativeRefStatus(rowTicket) };
      } finally {
        globalThis.cancelAnimationFrame = original;
      }
    },
    wrongMembers() {
      const current = setup();
      let reads = 0;
      const fake = new Proxy(
        {},
        {
          get() {
            reads++;
            throw Error("alleged row");
          },
        },
      );
      let denied = false;
      try {
        issueNativeRow(current.target, fake as never);
      } catch {
        denied = true;
      }
      return { denied, reads };
    },
    foreign(other: { current(): { model: Model } }): boolean {
      const current = setup();
      const foreignRow = required(other.current().model.view?.rows[0]);
      try {
        issueNativeRow(current.target, foreignRow);
        return false;
      } catch {
        return true;
      }
    },
    brands() {
      const current = setup(),
        row = required(current.model.view?.rows[0]);
      const attempt = (node: unknown) => {
        const ticket = issueNativeRow(current.target, row),
          callback = nativeRowRef(ticket);
        let threw = false;
        try {
          callback(node as never);
        } catch {
          threw = true;
        }
        return { threw, status: nativeRefStatus(ticket) };
      };
      return [
        attempt(document.createElement("td")),
        attempt(document.createElement("div")),
        attempt(Object.create(HTMLTableRowElement.prototype)),
        attempt(
          new Proxy(
            required(savedNode ?? container.querySelector("tbody tr")),
            {},
          ),
        ),
      ];
    },
    getterReentry() {
      const current = setup();
      const node = required(
        container.querySelector<HTMLTableRowElement>("tbody tr"),
      );
      let reentered = false;
      const proxy = new Proxy(node, {
        getPrototypeOf(value) {
          if (!reentered) {
            reentered = true;
            current.cell.updateModel(current.lease, current.model);
          }
          return Object.getPrototypeOf(value);
        },
      });
      const ticket = issueNativeRow(
        current.target,
        required(current.model.view?.rows[0]),
      );
      let threw = false;
      try {
        nativeRowRef(ticket)(proxy);
      } catch {
        threw = true;
      }
      return { reentered, threw, phase: nativeRefStatus(ticket) };
    },
    sourceReset() {
      const before = rowTicket;
      let observed = "missing";
      const stop = required(cell).subscribe(() => {
        observed = nativeRefStatus(before);
      });
      const result = f.app.reset();
      stop();
      return {
        status: nativeRefStatus(before),
        observed,
        phase: result.snapshot.phase,
      };
    },
    refreshModel() {
      comparison = { model: required(model), ticket: rowTicket };
      required(setOptions)(f.options());
    },
    updateReentry() {
      const current = setup();
      const stop = current.cell.subscribe(() => {
        try {
          current.cell.updateModel(current.lease, current.model);
        } catch {
          /* expected */
        }
      });
      try {
        current.cell.commit(current.lease, current.model, config);
      } catch {
        /* outer denial */
      }
      stop();
      return nativeRefStatus(rowTicket);
    },
    cancelDebt(kind: "throw" | "nonvoid") {
      const current = setup(),
        original = globalThis.clearTimeout;
      let fail = true,
        runs = 0,
        cancels = 0;
      const stop = ((token: ReturnType<typeof setTimeout>) => {
        cancels++;
        if (fail) {
          if (kind === "throw") throw Error("fixed timer cancellation failure");
          return 1;
        }
        original(token);
        return undefined;
      }) as typeof clearTimeout;
      globalThis.clearTimeout = stop;
      try {
        const work = current.cell.timeout(current.actor, 60_000, () => {
          runs++;
          return undefined;
        });
        current.cell.updateModel(current.lease, current.model);
        const validUpdateKept = cancels === 0;
        let liveAllowed = true;
        try {
          issueNativeScope(current.target);
        } catch {
          liveAllowed = false;
        }
        try {
          current.cell.cancelWork(current.actor, work);
        } catch {
          /* exact debt retained */
        }
        let debtDenied = false;
        try {
          issueNativeScope(current.target);
        } catch {
          debtDenied = true;
        }
        fail = false;
        current.cell.cancelWork(current.actor, work);
        const fresh = issueNativeScope(current.target);
        return {
          liveAllowed,
          validUpdateKept,
          debtDenied,
          fresh: nativeRefStatus(fresh),
          runs,
          cancels,
        };
      } finally {
        globalThis.clearTimeout = original;
      }
    },
    suspend() {
      suspend = true;
      required(repaint)();
    },
    resume() {
      suspend = false;
      resolve?.();
      required(repaint)();
    },
    current: setup,
    dispose() {
      root.unmount();
      if (cell && lease) cell.disconnect(lease);
      if (!shared) f.dispose();
      container.remove();
    },
  };
}
const first = harness("first");
const second = harness("second", first.f); // Same real C/P and IDs; distinct P2 frame owner/cell.
const remote = harness("remote", undefined, true);
declare global {
  interface Window {
    nativeLifetime: {
      first: ReturnType<typeof harness>;
      second: ReturnType<typeof harness>;
      remote: ReturnType<typeof harness>;
    };
  }
}
window.nativeLifetime = { first, second, remote };
