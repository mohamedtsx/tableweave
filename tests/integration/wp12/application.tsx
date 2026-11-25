import { Button } from "@heroui/react/button";
import {
  DataTable,
  TableDetailsTrigger,
  useDetailsAccessory,
  type DataTableProps,
  type DetailsRenderContext,
} from "@tableweave/heroui";
import {
  defineTable,
  useDataTable,
  useTableweaveState,
  type NativeColumnDef,
} from "@tableweave/react";
import { canonicalJson } from "@tableweave/react/contracts";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { I18nProvider } from "react-aria/I18nProvider";
import { transactionDefinition } from "../../../apps/examples/shared/definitions.js";
import {
  createExampleDetails,
  TransactionDetails,
  useExampleDetailSource,
} from "../../../apps/examples/shared/details.js";
import { createExampleOwner } from "../../../apps/examples/shared/owner.js";
import {
  transactions,
  type Transaction,
} from "../../../apps/examples/shared/records.js";
import {
  exampleOperators,
  transactionSchema,
  type TransactionSchema,
} from "../../../apps/examples/shared/schemas.js";
import { transactionRecipeTools } from "../../../apps/examples/recipes/custom-filter.js";
import { recipeLocale } from "../../../apps/examples/recipes/locale-recovery.js";
import {
  syntheticBulkActions,
  reviewSyntheticRow,
} from "../../../apps/examples/recipes/row-bulk-actions.js";
import {
  createDrafts,
  createEvents,
  type Drafts,
  type Owner,
} from "./events.js";

type Props = DataTableProps<TransactionSchema, Transaction>;
const LocaleContext = createContext("en-US");
function LocalizedAmount({ value }: { value: number }) {
  const locale = useContext(LocaleContext);
  return (
    <bdi>
      {new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(
        value,
      )}
    </bdi>
  );
}
function LocalizedDate({ value }: { value: string }) {
  const locale = useContext(LocaleContext);
  return (
    <bdi>
      {new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(value))}
    </bdi>
  );
}
function InlineNote({
  owner,
  drafts,
  id,
}: {
  owner: Owner;
  drafts: Drafts;
  id: string;
}) {
  const values = useSyncExternalStore(
    drafts.subscribe,
    drafts.getSnapshot,
    drafts.getSnapshot,
  );
  return (
    <input
      className="wp12-note"
      aria-label={`Native note ${id}`}
      value={values[id] ?? ""}
      onChange={(event) => drafts.edit(owner, id, event.target.value)}
    />
  );
}

/** Actual app construction, ONCE; columns are typed public definition INPUT. */
function createInstance(id: "a" | "b", grouped: boolean) {
  let owner: Owner;
  const drafts = createDrafts();
  const utilities: readonly NativeColumnDef<Transaction>[] = [
    {
      id: "details",
      header: "Details",
      meta: { utility: true },
      cell: ({ row }) => (
        <TableDetailsTrigger rowId={row.id} label={`View details ${row.id}`}>
          View details
        </TableDetailsTrigger>
      ),
    },
    {
      id: "review",
      header: "Application action",
      meta: { utility: true },
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => reviewSyntheticRow(owner, row.id)}
        >
          Review {row.id}
        </Button>
      ),
    },
    ...(id === "b"
      ? [
          {
            id: "nativeNote",
            header: "Working note",
            meta: { utility: true },
            cell: ({ row }) => (
              <InlineNote owner={owner} drafts={drafts} id={row.id} />
            ),
          } satisfies NativeColumnDef<Transaction>,
        ]
      : []),
  ];
  const base = transactionDefinition({
    full: true,
    grouped: id === "b" && grouped,
    utilities,
  });
  const columns: readonly NativeColumnDef<Transaction>[] =
    base.native.columns.map((column) =>
      column.id === "amount"
        ? {
            ...column,
            cell: ({ row }) => <LocalizedAmount value={row.original.amount} />,
          }
        : column.id === "occurred"
          ? {
              ...column,
              cell: ({ row }) => (
                <LocalizedDate value={row.original.occurred} />
              ),
            }
          : column,
    );
  const D = defineTable<Transaction>()({
    schema: transactionSchema,
    getRowId: base.native.getRowId,
    columns,
    selection: "multiple",
    details: true,
    multiSort: true,
    isRowSelectable: (record) => record.id !== "tx-002",
    evaluation: { registry: exampleOperators },
    tools: base.tools,
    defaultColumns: { visibility: { reference: false } },
    reordering: { rows: id === "b", columns: id === "b" },
  });
  owner = createExampleOwner(D, transactions, {
    id: `wp12-${id}`,
    server: id === "a",
    manualRows: id === "b",
  });
  const driver = createExampleDetails(owner),
    events = createEvents(owner, driver, drafts);
  return { id, owner, driver, drafts, events };
}
export type Instance = ReturnType<typeof createInstance>;
export interface ApplicationAPI {
  readonly a: Instance;
  readonly b: Instance;
}
declare global {
  interface Window {
    wp12: ApplicationAPI;
  }
}

function Controls({
  app,
  shown,
  onShown,
}: {
  app: Instance;
  shown: boolean;
  onShown: () => void;
}) {
  const { owner, events } = app;
  const own = useSyncExternalStore(
    owner.subscribe,
    owner.getSnapshot,
    owner.getServerSnapshot,
  );
  const resource = useSyncExternalStore(
    owner.remote.resource.subscribe,
    owner.remote.resource.getSnapshot,
    owner.remote.resource.getServerSnapshot,
  );
  const options = useSyncExternalStore(
    owner.numericOptions.source.subscribe,
    owner.numericOptions.source.getSnapshot,
    owner.numericOptions.source.getServerSnapshot,
  );
  const transport = owner.reorder;
  return (
    <details className="wp12-controls">
      <summary>Application {app.id.toUpperCase()} controls</summary>
      <div className="wp12-control-buttons">
        <Button variant="tertiary" onPress={onShown}>
          {shown ? "Hide renderer" : "Show renderer"}
        </Button>
        <Button
          variant="secondary"
          isDisabled={!own.access}
          onPress={events.revoke}
        >
          Revoke application access
        </Button>
        {app.id === "a" ? (
          <>
            <Button
              variant="tertiary"
              isDisabled={!own.access || resource.busy}
              onPress={() => {
                owner.remote.begin();
              }}
            >
              Begin refresh
            </Button>
            <Button
              variant="secondary"
              isDisabled={!resource.busy}
              onPress={() => {
                owner.remote.succeed();
              }}
            >
              Deliver known page
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!resource.busy}
              onPress={() => {
                owner.remote.succeed("unknown");
              }}
            >
              Deliver unknown page
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!resource.busy}
              onPress={() => {
                owner.remote.fail();
              }}
            >
              Fail request
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!own.access}
              onPress={() => {
                owner.replaceRecords([]);
                owner.remote.begin();
              }}
            >
              Supply empty input
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!resource.busy || own.records.length > 0}
              onPress={() => {
                owner.remote.succeed("unknown", "unknown");
              }}
            >
              Deliver unknown empty
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!own.access}
              onPress={() => {
                owner.replaceRecords(transactions.slice(0, 1));
                owner.remote.begin();
              }}
            >
              Supply one record
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!options.busy}
              onPress={() => {
                owner.numericOptions.respond();
              }}
            >
              Deliver account options
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!options.busy}
              onPress={() => {
                owner.numericOptions.respond(true);
              }}
            >
              Deliver empty options
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!options.busy}
              onPress={() => {
                owner.numericOptions.fail();
              }}
            >
              Fail account options
            </Button>
          </>
        ) : null}
        {transport ? (
          <>
            <Button
              variant="secondary"
              isDisabled={!transport.canSettle}
              onPress={() =>
                transport.settle({
                  kind: "accepted",
                  revision: "synthetic-app",
                })
              }
            >
              Accept synthetic transport
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!transport.canSettle}
              onPress={() =>
                transport.settle({ kind: "indeterminate", code: "timeout" })
              }
            >
              Report synthetic timeout
            </Button>
            <Button
              variant="tertiary"
              isDisabled={!transport.canSettle}
              onPress={() =>
                transport.settle({ kind: "rejected", code: "conflict" })
              }
            >
              Reject synthetic conflict
            </Button>
            <Button
              variant="secondary"
              isDisabled={!transport.canPublish}
              onPress={transport.publishApplied}
            >
              Publish authoritative input
            </Button>
          </>
        ) : null}
      </div>
    </details>
  );
}

function Surface({ app, rtl }: { app: Instance; rtl: boolean }) {
  const { owner, driver, drafts, events } = app;
  const own = useSyncExternalStore(
    owner.subscribe,
    owner.getSnapshot,
    owner.getServerSnapshot,
  );
  const state = useTableweaveState(owner.C);
  useSyncExternalStore(
    owner.remote.resource.subscribe,
    owner.remote.resource.getSnapshot,
    owner.remote.resource.getServerSnapshot,
  );
  const [shown, setShown] = useState(true);
  const fallback = useRef<HTMLButtonElement>(null);
  // This lifetime remains above renderer visibility, as do the genuine model,
  // detail source and row-operation application lease. Strict cleanup is real.
  useLayoutEffect(() => {
    // Our inline store can register before the shared owner's C-notifying purge.
    // This does NOT reorder or repair its separately mounted detail participant.
    const stopDrafts = owner.P.registerParticipant(owner.criteria(), {
      purge: drafts.purge,
    });
    const stop = owner.connect(),
      stopEvents = events.connect();
    if (app.id === "a") owner.remote.begin();
    return () => {
      stopEvents();
      stopDrafts();
      stop();
    };
  }, [app, owner, events, drafts]);
  useEffect(() => {
    const stopNumeric = owner.numericOptions.source.connect(),
      stopString = owner.stringOptions.source.connect();
    return () => {
      stopNumeric();
      stopString();
    };
  }, [owner]);
  useEffect(() => {
    owner.dispatch({
      type: "query.context",
      locale: rtl ? "ar-EG" : "en-US",
      timeZone: "UTC",
    });
  }, [owner, rtl]);
  const model = useDataTable(owner.D, owner.modelOptions());
  useLayoutEffect(() => {
    owner.reorder?.commit(model);
  });
  const detail = useExampleDetailSource(driver);
  const focusFallback = useCallback(
    () => fallback.current?.focus({ preventScroll: true }),
    [],
  );
  const renderBody = useCallback(
    (context: DetailsRenderContext<TransactionSchema, Transaction>) => (
      <>
        <output className="wp12-metadata" aria-label="Detail native row">
          {context.row ? context.row.id : "none"}
        </output>
        <TransactionDetails context={context} owner={owner} driver={driver} />
      </>
    ),
    [owner, driver],
  );
  const renderFooter = useCallback(
    (context: DetailsRenderContext<TransactionSchema, Transaction>) => (
      <Button
        variant="tertiary"
        onPress={() => {
          void context.requestClose("footer");
        }}
      >
        Close record details
      </Button>
    ),
    [],
  );
  const accessoryOptions = useMemo(
    () => ({
      expected: detail.authority.context,
      authority: detail.authority,
      source: detail.source,
      port: driver.port,
      title: `Application ${app.id.toUpperCase()} record details`,
      beforeChange: driver.beforeChange,
      focusFallback,
      renderBody,
      renderFooter,
    }),
    [
      app.id,
      detail.authority,
      detail.source,
      driver,
      focusFallback,
      renderBody,
      renderFooter,
    ],
  );
  const accessory = useDetailsAccessory(model, accessoryOptions);
  const tools = useMemo<NonNullable<Props["tools"]>>(() => {
    const recipe = transactionRecipeTools();
    return app.id === "a"
      ? {
          ...recipe,
          builder: {
            ...recipe.builder,
            fields: {
              ...recipe.builder?.fields,
              account: {
                label: "Account",
                asyncOptions: {
                  idType: "number",
                  source: owner.numericOptions.source,
                  onRequest: owner.numericOptions.onRequest,
                  nextPageKey: owner.numericOptions.nextPageKey,
                },
              },
            },
          },
        }
      : recipe;
  }, [app.id, owner]);
  const actions = useMemo(() => syntheticBulkActions(owner), [owner]);
  const collection = useMemo<Props["collection"]>(
    () => ({
      label: `Application ${app.id.toUpperCase()} transactions`,
      rowHeaderColumnId: "description",
      selectionColumnId: "selection",
      rowTextValue: (row) => row.original.description,
      columnTextValue: (column) =>
        typeof column.columnDef.header === "string"
          ? column.columnDef.header
          : column.id,
      cellTextValue: (cell) => String(cell.getValue() ?? ""),
    }),
    [app.id],
  );
  const lease = owner.reorder?.lease;
  const reordering = useMemo<Props["reordering"]>(
    () =>
      owner.reorder && lease
        ? {
            columns: true,
            rows: {
              admission: owner.reorder.admission,
              lease,
              handleColumnId: "description",
              onSubmit(operation) {
                events.submitted(operation);
                owner.reorder?.onSubmit(operation);
              },
            },
          }
        : undefined,
    [owner, lease, events],
  );
  const locale = recipeLocale(rtl);
  return (
    <section
      id={`instance-${app.id}`}
      aria-label={`Application ${app.id.toUpperCase()}`}
      className="wp12-instance"
    >
      <header>
        <h2>
          Application {app.id.toUpperCase()} ·{" "}
          {app.id === "a" ? "server responses" : "manual input order"}
        </h2>
        <p>
          Same synthetic row IDs; separate source and scope. No backend
          authorization or persistence is implied.
        </p>
      </header>
      <button type="button" className="wp12-return" ref={fallback}>
        Application {app.id.toUpperCase()} safe focus
      </button>
      {shown ? (
        <DataTable
          table={model}
          collection={collection}
          locale={locale}
          neutralMessages={locale.neutralMessages}
          tools={tools}
          actions={actions}
          accessory={accessory}
          {...(reordering ? { reordering } : {})}
          {...(app.id === "a"
            ? {
                onRetry: () => {
                  owner.remote.resource.retry();
                },
              }
            : {})}
        />
      ) : null}
      <p
        role="status"
        aria-label={`Application ${app.id.toUpperCase()} notice`}
      >
        {own.notice}
      </p>
      {owner.reorder ? (
        <p role="status" aria-label="Transport notice">
          {owner.reorder.notice}
        </p>
      ) : null}
      <Controls
        app={app}
        shown={shown}
        onShown={() => setShown((value) => !value)}
      />
      <details className="wp12-diagnostics">
        <summary>Read-only {app.id.toUpperCase()} state</summary>
        <dl>
          <dt>Accepted query</dt>
          <dd>
            <output aria-label="Accepted query">
              {canonicalJson(state.query)}
            </output>
          </dd>
          <dt>Selected IDs</dt>
          <dd>
            <output aria-label="Selected IDs">
              {Object.entries(state.selection)
                .filter(([, selected]) => selected)
                .map(([id]) => id)
                .join(",") || "none"}
            </output>
          </dd>
          <dt>Column state</dt>
          <dd>
            <output aria-label="Column state">
              {canonicalJson(state.columns)}
            </output>
          </dd>
          <dt>Recovery</dt>
          <dd>
            <output aria-label="Model recovery">{model.recovery.kind}</output>
          </dd>
        </dl>
      </details>
    </section>
  );
}

export function Application({ grouped }: { readonly grouped: boolean }) {
  const [a] = useState(() => createInstance("a", false)),
    [b] = useState(() => createInstance("b", grouped));
  const [rtl, setRtl] = useState(false),
    [dark, setDark] = useState(false);
  useLayoutEffect(() => {
    window.wp12 = { a, b };
  }, [a, b]);
  useLayoutEffect(() => {
    document.documentElement.lang = rtl ? "ar" : "en";
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [rtl, dark]);
  return (
    <LocaleContext.Provider value={recipeLocale(rtl).locale}>
      <I18nProvider locale={recipeLocale(rtl).locale}>
        <main className="wp12-page" dir={rtl ? "rtl" : "ltr"}>
          <header className="wp12-heading">
            <h1>Integrated transaction workspace</h1>
            <p>
              WP-12 provisional source fixture. All runtime and manual checks
              UNRUN. Dragging/G-02 remains user-blocked.
            </p>
            <div className="wp12-control-buttons">
              <Button
                variant="tertiary"
                onPress={() => setDark((value) => !value)}
              >
                Toggle theme
              </Button>
              <Button
                variant="tertiary"
                onPress={() => setRtl((value) => !value)}
              >
                Toggle direction
              </Button>
            </div>
            <p>
              <bdi>TX-001 / REF-24</bdi> ·{" "}
              <output aria-label="Locale number">
                {new Intl.NumberFormat(recipeLocale(rtl).locale, {
                  minimumFractionDigits: 2,
                }).format(-1234.5)}
              </output>{" "}
              ·{" "}
              <output aria-label="Locale date">
                {new Intl.DateTimeFormat(recipeLocale(rtl).locale, {
                  timeZone: "UTC",
                  dateStyle: "medium",
                }).format(new Date("2026-11-25T12:00:00Z"))}
              </output>
            </p>
          </header>
          <Surface app={a} rtl={rtl} />
          <Surface app={b} rtl={rtl} />
        </main>
      </I18nProvider>
    </LocaleContext.Provider>
  );
}
