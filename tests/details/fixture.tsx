import { Button } from "@heroui/react/button";
import { Popover } from "@heroui/react/popover";
import type { NativeTableView, StateProposal } from "@tableweave/react";
import {
  createNativeController,
  defineNativeTable,
  useNativeTable,
} from "@tableweave/react";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type {
  DetailsAuthority,
  DetailsContext,
  DetailsNativeFrame,
  DetailsOptions,
  DetailsOutcome,
  DetailsSession,
  DetailsSource,
} from "../../packages/heroui/src/details/index.js";
import {
  DetailsShell,
  DetailsTrigger,
  useDetailsSession,
} from "../../packages/heroui/src/details/index.js";

export interface RecordItem {
  id: string;
  name: string;
  description: string;
}
const records: readonly RecordItem[] = [
  {
    id: "a",
    name: "Synthetic transaction",
    description: "A supplied application record.",
  },
  {
    id: "b",
    name: "Synthetic customer",
    description: "A different custom layout.",
  },
  {
    id: "c",
    name: "Synthetic inventory",
    description: "A consumer-owned form.",
  },
];
const schema = defineQuerySchema({
  id: "details-browser",
  version: 1,
  fields: { name: { type: "text", owner: "none" } },
});
export function createFixture(
  controlled = false,
  initialId: string | null = null,
) {
  const definition = defineNativeTable({
    schema,
    details: true,
    selection: true,
    getRowId: (record: RecordItem) => record.id,
    columns: [{ id: "name", accessorKey: "name", header: "Name" }],
  });
  const listeners = new Set<() => void>();
  let proposal: StateProposal<typeof schema> | null = null;
  let lastId = initialId;
  const controller = createNativeController(definition, {
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      details: { rowId: initialId },
    },
    now: () => 0,
    ...(controlled
      ? {
          controlled: ["details"] as const,
          onRequest: (next: StateProposal<typeof schema>) => {
            proposal = next;
          },
        }
      : {}),
    onCommit(transition) {
      const id = transition.state.details.rowId;
      if (lastId !== id) {
        lastId = id;
        const authority = {
          ...snapshot.authority,
          rowId: id,
          session: snapshot.authority.session + 1,
          generation: snapshot.authority.generation + 1,
        };
        set({
          authority,
          source: id
            ? {
                authority,
                status: "ready",
                record: records.find((r) => r.id === id) ?? {
                  id,
                  name: "Off-page record",
                  description: "Application supplied.",
                },
              }
            : null,
        });
      }
    },
  });
  const initialContext: DetailsContext = {
    definitionKey: controller.getSnapshot().definitionIdentity,
    datasetKey: "fixture",
    scopeKey: "scope-a",
    access: true,
    epoch: 0,
  };
  const authority: DetailsAuthority = {
    context: initialContext,
    rowId: initialId,
    session: 0,
    generation: 0,
  };
  let snapshot: {
    expected: DetailsContext;
    authority: DetailsAuthority;
    source: DetailsSource<RecordItem> | null;
    policy: "allow" | "deny" | "async" | "throw";
    mounted: boolean;
    rows: boolean;
    nativeRecords: readonly RecordItem[];
    nativeOrigin: DetailsContext;
    layout: "summary" | "custom" | "form";
    interior: boolean;
    direction: "ltr" | "rtl";
    dark: boolean;
    expanded: boolean;
    outcome: string;
    saved: number;
    fallback: string;
    policyCalls: number;
  } = {
    expected: initialContext,
    authority,
    source: initialId
      ? {
          authority,
          status: "ready",
          record:
            records.find((r) => r.id === initialId) ??
            (records[0] as RecordItem),
        }
      : null,
    policy: "allow",
    mounted: true,
    rows: true,
    nativeRecords: records,
    nativeOrigin: initialContext,
    layout: "summary",
    interior: false,
    direction: "ltr",
    dark: false,
    expanded: false,
    outcome: "none",
    saved: 0,
    fallback: "none",
    policyCalls: 0,
  };
  const serverSnapshot = snapshot;
  let detailsController = controller;
  function set(patch: Partial<typeof snapshot>) {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener();
  }
  let resolver: ((value: boolean) => void) | null = null;
  let session: DetailsSession<typeof schema, RecordItem> | null = null;
  let savedClose: (() => Promise<DetailsOutcome<typeof schema>>) | null = null;
  let liveView: NativeTableView<typeof schema, RecordItem> | null = null;
  let liveFrame: DetailsNativeFrame<typeof schema, RecordItem> | null = null;
  let retainedFrame: DetailsNativeFrame<typeof schema, RecordItem> | null =
    null;
  let frameInput: {
    records: readonly RecordItem[];
    rows: boolean;
    state: NativeTableView<typeof schema, RecordItem>["state"];
    origin: DetailsContext;
  } | null = null;
  const port = {
    read: () => {
      const nativeFrame = retainedFrame ?? liveFrame;
      return {
        authority: snapshot.authority,
        ...(nativeFrame ? { nativeFrame } : {}),
      };
    },
    retry: () => {
      const next = {
        ...snapshot.authority,
        generation: snapshot.authority.generation + 1,
      };
      set({ authority: next, source: { authority: next, status: "loading" } });
    },
  };
  const api = {
    privatePort: () => port,
    detailsController: () => detailsController,
    replaceDetailsController() {
      const state = controller.getSnapshot();
      detailsController = createNativeController(definition, {
        initial: { query: state.query, details: state.details },
        now: () => 0,
      });
      set({});
    },
    controller,
    retainNativeView() {
      retainedFrame = liveFrame;
    },
    useCurrentNativeFrame() {
      retainedFrame = null;
      set({});
    },
    nativeView: () => liveView,
    set,
    read: () => snapshot,
    readSession: () => session,
    accept() {
      if (proposal) {
        const p = proposal;
        proposal = null;
        controller.accept(p);
      }
    },
    reject() {
      if (proposal) {
        const p = proposal;
        proposal = null;
        controller.reject(p);
      }
    },
    hasProposal: () => proposal !== null,
    resolve(value: boolean) {
      resolver?.(value);
      resolver = null;
    },
    open(id: string) {
      controller.dispatch({ type: "details.change", update: { rowId: id } });
    },
    captureClose() {
      const captured = session;
      savedClose = captured ? () => captured.requestClose() : null;
    },
    invokeSavedClose: () => savedClose?.(),
    setAuthorityWithoutRender(next: DetailsAuthority) {
      snapshot = { ...snapshot, authority: next };
    },
    publish() {
      set({});
    },
  };
  function DetailOwner() {
    const state = useSyncExternalStore(
      (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      () => snapshot,
      () => serverSnapshot,
    );
    const fallbackRef = useRef<HTMLButtonElement>(null);
    const view = useNativeTable(definition, controller, {
      mode: "client",
      records: state.rows ? state.nativeRecords : [],
    });
    const options: DetailsOptions<typeof schema, RecordItem> = {
      controller: detailsController,
      expected: state.expected,
      authority: state.authority,
      source: state.source,
      port,
      visibleFieldIds: ["name"],
      hiddenFieldIds: ["description"],
      beforeChange() {
        set({ policyCalls: snapshot.policyCalls + 1 });
        if (snapshot.policy === "throw")
          throw new Error("Private fixture error must not escape");
        if (snapshot.policy === "async")
          return new Promise<boolean>((resolve) => {
            resolver = resolve;
          });
        return snapshot.policy === "allow";
      },
      onOutcome(outcome) {
        set({ outcome: outcome.status });
      },
      focusFallback(reason) {
        set({ fallback: reason });
        fallbackRef.current?.focus();
      },
    };
    const details = useDetailsSession(windowSafeTransform(options));
    useLayoutEffect(() => {
      session = details;
      liveView = view;
      // App-owned input/frame association is captured only at commit, not tagged
      // from whichever authority happens to be current when port.read is called.
      if (
        !frameInput ||
        frameInput.records !== state.nativeRecords ||
        frameInput.rows !== state.rows ||
        frameInput.state !== view.state ||
        frameInput.origin !== state.nativeOrigin
      ) {
        frameInput = {
          records: state.nativeRecords,
          rows: state.rows,
          state: view.state,
          origin: state.nativeOrigin,
        };
        liveFrame = Object.freeze({
          origin: Object.freeze({ ...state.nativeOrigin }),
          owner: controller,
          view,
        });
        set({});
      }
    });
    return (
      <main
        dir={state.direction}
        data-theme={state.dark ? "dark" : "light"}
        style={{ fontSize: state.expanded ? "200%" : "100%" }}
      >
        <Button ref={fallbackRef}>Safe table focus</Button>
        <output data-target>{view.state.details.rowId ?? "closed"}</output>
        <output data-outcome>{state.outcome}</output>
        <output data-fallback>{state.fallback}</output>
        <output data-selected>{view.selectedIds.join(",")}</output>
        <div className="fixture-record-scroll">
          <table aria-label="Synthetic records">
            <tbody>
              {view.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      aria-label={`Select ${row.id}`}
                      type="checkbox"
                      checked={view.state.selection[row.id] === true}
                      onChange={(event) =>
                        row.toggleSelected(event.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <a href="#linked">{row.original.name}</a>
                    <span data-select-text> Selectable row text </span>
                  </td>
                  <td>
                    <Button onPress={() => set({ saved: state.saved + 1 })}>
                      Row action {row.id}
                    </Button>
                  </td>
                  <td>
                    <DetailsTrigger
                      session={details}
                      rowId={row.id}
                      label={`Details ${row.id}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DetailsTrigger
          session={details}
          rowId="off-page"
          label="Details off-page"
        />
        <DetailsShell
          session={details}
          title={state.direction === "rtl" ? "تفاصيل السجل" : "Record details"}
          direction={state.direction}
          {...(state.interior
            ? {
                renderInterior: (
                  ctx: DetailsSession<typeof schema, RecordItem>["context"],
                ) => (
                  <section className="fixture-full-interior">
                    <h2>Entirely custom interior</h2>
                    <textarea
                      aria-label="Custom interior draft"
                      defaultValue="Custom"
                    />
                    <Button
                      variant="secondary"
                      onPress={() => {
                        void ctx?.requestClose("footer");
                      }}
                    >
                      Custom interior exit
                    </Button>
                  </section>
                ),
              }
            : {})}
          messages={
            state.direction === "rtl"
              ? {
                  close: "إغلاق التفاصيل",
                  cancel: "إغلاق",
                  loading: "جار التحميل",
                  retry: "إعادة المحاولة",
                }
              : {}
          }
          renderHeader={(ctx) => <p data-record-id>{ctx.recordId}</p>}
          renderBody={(ctx) => (
            <>
              <output data-native-row>{ctx.row?.id ?? "none"}</output>
              {state.layout === "summary" ? (
                ctx.record ? (
                  <dl className="fixture-summary">
                    <dt>Supplied summary</dt>
                    <dd>{ctx.record?.name}</dd>
                    <dt>Context</dt>
                    <dd>{ctx.visibleFieldIds.join(",")}</dd>
                  </dl>
                ) : null
              ) : state.layout === "custom" ? (
                <article className="fixture-custom">
                  <h2>Custom customer layout</h2>
                  <p>{ctx.record?.name}</p>
                  <aside>Consumer-defined panel</aside>
                </article>
              ) : (
                <form
                  className="fixture-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    set({ saved: state.saved + 1 });
                  }}
                >
                  <label>
                    Consumer draft
                    <input
                      name="draft"
                      aria-label="Consumer draft"
                      defaultValue="Unsaved"
                    />
                  </label>
                  <Button type="submit">Save application draft</Button>
                </form>
              )}
              <Popover>
                <Button variant="secondary">Nested help</Button>
                <Popover.Content>
                  <Popover.Dialog aria-label="Help">
                    <Popover.Heading>Help</Popover.Heading>
                    <Button variant="secondary" slot="close">
                      Close help
                    </Button>
                  </Popover.Dialog>
                </Popover.Content>
              </Popover>
              <div style={{ blockSize: 1200 }}>
                Long arbitrary content {ctx.record?.description}
              </div>
            </>
          )}
          renderFooter={(ctx) => (
            <>
              <Button
                onPress={() => {
                  void ctx.requestClose("footer");
                }}
              >
                Footer Cancel
              </Button>
              <Button
                onPress={() => {
                  void ctx.requestOpen("b");
                }}
              >
                Open another record
              </Button>
              <output data-saved>{state.saved}</output>
            </>
          )}
        />
      </main>
    );
  }
  function App() {
    const state = useSyncExternalStore(
      (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      () => snapshot,
      () => serverSnapshot,
    );
    return state.mounted ? (
      <DetailOwner />
    ) : (
      <Button autoFocus>Unmounted safe target</Button>
    );
  }
  return { App, api };
}
export type FixtureApi = ReturnType<typeof createFixture>["api"];

export type FixtureDetailsOptions = DetailsOptions<typeof schema, RecordItem>;
function windowSafeTransform(
  options: FixtureDetailsOptions,
): FixtureDetailsOptions {
  return typeof window !== "undefined" && window.detailsOptionsTransform
    ? window.detailsOptionsTransform(options)
    : options;
}
