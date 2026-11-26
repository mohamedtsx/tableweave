import { Button } from "@heroui/react/button";
import {
  arabicDataTableLocale,
  DataTable,
  type DataTableProps,
  type DetailsRenderContext,
  englishDataTableLocale,
  type FilterCustomEditorProps,
  TableDetailsTrigger,
  useDetailsAccessory,
} from "@tableweave/heroui";
import {
  type DataTableModel,
  type NativeColumnDef,
  useDataTable,
  useTableweaveState,
} from "@tableweave/react";
import {
  canonicalJson,
  createQuery,
  type QuerySchema,
} from "@tableweave/react/contracts";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { I18nProvider } from "react-aria/I18nProvider";
import {
  customerDefinition,
  inventoryDefinition,
  minimalTransactionDefinition,
  transactionDefinition,
} from "../../../examples/shared/definitions.js";
import {
  CustomerDetails,
  createExampleDetails,
  type ExampleDetails,
  InventoryDetails,
  TransactionDetails,
  useExampleDetailSource,
} from "../../../examples/shared/details.js";
import {
  createExampleOwner,
  type ExampleOwner,
} from "../../../examples/shared/owner.js";
import {
  type Customer,
  customers,
  type InventoryItem,
  inventory,
  type Transaction,
  transactions,
} from "../../../examples/shared/records.js";
import {
  type CustomerSchema,
  exampleOperators,
  type InventorySchema,
  ownerConflictDiagnostic,
  type TransactionSchema,
} from "../../../examples/shared/schemas.js";

export type RecoveryScenario =
  | "ready"
  | "loading"
  | "refreshing"
  | "initial-error"
  | "refresh-error"
  | "empty"
  | "no-results"
  | "unknown-empty"
  | "unknown-total";
export interface Appearance {
  readonly dark?: boolean;
  readonly rtl?: boolean;
  readonly width?: number;
}
export type TransactionScenario =
  | "plain"
  | "rules"
  | "independent"
  | "entities"
  | "families";
const transactionLabel = (record: Transaction) => record.description;
const customerLabel = (record: Customer) => record.name;
const inventoryLabel = (record: InventoryItem) => record.title;
function utility<T extends { id: string }>(): readonly NativeColumnDef<T>[] {
  return [
    {
      id: "details",
      header: "Details",
      meta: { utility: true },
      cell: (context) => (
        <TableDetailsTrigger
          rowId={context.row.id}
          label={`View details ${context.row.id}`}
        >
          View details
        </TableDetailsTrigger>
      ),
    },
  ];
}
interface SurfaceProps<S extends QuerySchema, T extends object>
  extends Appearance {
  readonly app: ExampleOwner<S, T>;
  readonly title: string;
  readonly rowHeader: string;
  readonly label: (record: T) => string;
  readonly tools?: DataTableProps<S, T>["tools"];
  readonly full?: boolean;
  readonly server?: boolean;
  readonly children?: ReactNode;
  readonly body?: (
    context: DetailsRenderContext<S, T>,
    driver: ExampleDetails<S, T>,
  ) => ReactNode;
}
function BoundTable<S extends QuerySchema, T extends object>({
  model,
  app,
  input,
  body,
  shown,
}: {
  model: DataTableModel<S, T>;
  app: ExampleOwner<S, T>;
  input: DataTableProps<S, T>;
  body: NonNullable<SurfaceProps<S, T>["body"]>;
  shown: boolean;
}) {
  const [driver] = useState(() => createExampleDetails(app));
  const detail = useExampleDetailSource(driver);
  const fallback = useRef<HTMLElement>(null);
  const renderBody = useCallback(
    (context: DetailsRenderContext<S, T>) => body(context, driver),
    [body, driver],
  );
  const focusFallback = useCallback(
    () => fallback.current?.focus({ preventScroll: true }),
    [],
  );
  const renderFooter = useCallback(
    (context: DetailsRenderContext<S, T>) => (
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
  const configuration = useMemo(
    () => ({
      expected: detail.authority.context,
      authority: detail.authority,
      source: detail.source,
      port: driver.port,
      title: "Synthetic record details",
      beforeChange: driver.beforeChange,
      focusFallback,
      renderBody,
      renderFooter,
    }),
    [
      detail.authority,
      detail.source,
      driver,
      focusFallback,
      renderBody,
      renderFooter,
    ],
  );
  const accessory = useDetailsAccessory(model, configuration);
  return (
    <>
      <section
        ref={fallback}
        tabIndex={-1}
        aria-label="Record details return location"
      />
      {shown ? <DataTable {...input} accessory={accessory} /> : null}
    </>
  );
}
/** The source/model hook remains mounted ABOVE optional renderer visibility. */
function Surface<S extends QuerySchema, T extends object>(
  props: SurfaceProps<S, T>,
) {
  const { app, title, rowHeader, label, tools, body } = props;
  const own = useSyncExternalStore(
    app.subscribe,
    app.getSnapshot,
    app.getServerSnapshot,
  );
  const state = useTableweaveState(app.C);
  const resource = useSyncExternalStore(
    app.remote.resource.subscribe,
    app.remote.resource.getSnapshot,
    app.remote.resource.getServerSnapshot,
  );
  const options = useSyncExternalStore(
    app.numericOptions.source.subscribe,
    app.numericOptions.source.getSnapshot,
    app.numericOptions.source.getServerSnapshot,
  );
  const [shown, setShown] = useState(true),
    [dark, setDark] = useState(props.dark ?? false),
    [rtl, setRtl] = useState(props.rtl ?? false),
    [width, setWidth] = useState(props.width ?? 1440);
  useEffect(() => {
    setDark(props.dark ?? false);
  }, [props.dark]);
  useEffect(() => {
    setRtl(props.rtl ?? false);
  }, [props.rtl]);
  useEffect(() => {
    setWidth(props.width ?? 1440);
  }, [props.width]);
  useLayoutEffect(() => app.connect(), [app]);
  // The builder owns the numeric source's single passive connection, outside
  // picker visibility. A second application lease would block that connection.
  useEffect(() => app.stringOptions.source.connect(), [app]);
  useEffect(() => {
    app.dispatch({
      type: "query.context",
      locale: rtl ? "ar-EG" : "en-US",
      timeZone: "UTC",
    });
  }, [app, rtl]);
  const model = useDataTable(app.D, app.modelOptions());
  useLayoutEffect(() => {
    try {
      app.reorder?.commit(model);
    } catch {
      /* Genuine wait: no fabricated model/ack or alternative grant. */
    }
  });
  const locale = rtl ? arabicDataTableLocale : englishDataTableLocale;
  const collection = useMemo<DataTableProps<S, T>["collection"]>(
    () => ({
      label: title,
      rowHeaderColumnId: rowHeader,
      ...(props.full ? { selectionColumnId: "selection" } : {}),
      rowTextValue: (row) => label(row.original),
      columnTextValue: (column) =>
        typeof column.columnDef.header === "string"
          ? column.columnDef.header
          : column.id,
      cellTextValue: (cell) => String(cell.getValue() ?? ""),
    }),
    [title, rowHeader, label, props.full],
  );
  const lease = app.reorder?.lease;
  const reordering = useMemo<DataTableProps<S, T>["reordering"]>(
    () =>
      app.reorder && lease
        ? {
            rows: {
              admission: app.reorder.admission,
              lease,
              handleColumnId: rowHeader,
              onSubmit(operation) {
                app.reorder?.onSubmit(operation);
              },
            },
          }
        : app.D.reordering.columns
          ? { columns: true }
          : undefined,
    [app, lease, rowHeader],
  );
  const actions = useMemo<NonNullable<DataTableProps<S, T>["actions"]>>(
    () => [
      {
        id: "review",
        label: "Queue synthetic review",
        onAction(context) {
          app.setNotice(
            `Synthetic review queue: ${context.selectedCount} IDs; ${context.loadedSelected.length} loaded records. No off-page objects were fabricated.`,
          );
        },
      },
    ],
    [app],
  );
  const input: DataTableProps<S, T> = {
    table: model,
    collection,
    locale,
    neutralMessages:
      locale.neutralMessages ?? englishDataTableLocale.neutralMessages,
    ...(tools ? { tools } : {}),
    ...(props.full ? { actions } : {}),
    ...(reordering ? { reordering } : {}),
    ...(props.server
      ? {
          onRetry: () => {
            app.remote.resource.retry();
          },
        }
      : {}),
  };
  const transport = app.reorder;
  return (
    <I18nProvider locale={locale.locale}>
      <main
        className={`${dark ? "dark " : ""}min-w-0 bg-background p-4 text-sm text-foreground sm:p-6`}
        data-workbench-play="idle"
        data-theme={dark ? "dark" : "light"}
        dir={locale.direction}
        aria-label={title}
      >
        <div className="mx-auto min-w-0 space-y-4" style={{ maxWidth: width }}>
          <header className="space-y-2">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-xs text-foreground">
              Synthetic application inputs. Provisional source catalog;
              dragging/G-02 is incomplete. No persistence or runtime acceptance
              is implied.
            </p>
          </header>
          {props.children}
          {body ? (
            <BoundTable
              model={model}
              app={app}
              input={input}
              body={body}
              shown={shown}
            />
          ) : shown ? (
            <DataTable {...input} />
          ) : null}
          <p role="status" aria-label="Application notice">
            {own.notice}
          </p>
          {transport ? (
            <p role="status" aria-label="Row transport notice">
              {transport.notice}
            </p>
          ) : null}
          <details className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer font-medium">
              Synthetic application controls
            </summary>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
              <label>
                Viewport sample
                <select
                  className="rounded border border-border bg-surface p-2"
                  value={width}
                  onChange={(event) => setWidth(Number(event.target.value))}
                >
                  {[320, 390, 768, 1024, 1440].map((value) => (
                    <option key={value} value={value}>
                      {value}px
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="tertiary"
                onPress={() => setShown((value) => !value)}
              >
                {shown ? "Hide table UI" : "Show table UI"}
              </Button>
              <Button
                variant="secondary"
                isDisabled={!own.access}
                onPress={app.revoke}
              >
                Revoke application access
              </Button>
              {own.proposal ? (
                <>
                  <Button variant="secondary" onPress={() => app.decide(true)}>
                    Accept proposed change
                  </Button>
                  <Button variant="tertiary" onPress={() => app.decide(false)}>
                    Reject proposed change
                  </Button>
                </>
              ) : null}
              {props.server ? (
                <>
                  <Button
                    variant="secondary"
                    isDisabled={!own.access || resource.busy}
                    onPress={() => {
                      app.remote.begin();
                    }}
                  >
                    Begin refresh
                  </Button>
                  <Button
                    variant="secondary"
                    isDisabled={!resource.busy}
                    onPress={() => {
                      app.remote.succeed();
                    }}
                  >
                    Deliver known page
                  </Button>
                  <Button
                    variant="tertiary"
                    isDisabled={!resource.busy}
                    onPress={() => {
                      app.remote.succeed("unknown");
                    }}
                  >
                    Deliver unknown page
                  </Button>
                  <Button
                    variant="tertiary"
                    isDisabled={!resource.busy}
                    onPress={() => {
                      app.remote.fail();
                    }}
                  >
                    Fail request
                  </Button>
                </>
              ) : null}
              {options.busy ? (
                <>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      app.numericOptions.respond();
                    }}
                  >
                    Deliver account options
                  </Button>
                  <Button
                    variant="tertiary"
                    onPress={() => {
                      app.numericOptions.respond(true);
                    }}
                  >
                    Deliver empty account options
                  </Button>
                  <Button
                    variant="tertiary"
                    onPress={() => {
                      app.numericOptions.fail();
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
                        revision: "synthetic-transport",
                      })
                    }
                  >
                    Accept synthetic transport
                  </Button>
                  <Button
                    variant="tertiary"
                    isDisabled={!transport.canSettle}
                    onPress={() =>
                      transport.settle({ kind: "rejected", code: "rejected" })
                    }
                  >
                    Reject synthetic transport
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
                    variant="tertiary"
                    isDisabled={!transport.canSettle}
                    onPress={() =>
                      transport.settle({
                        kind: "indeterminate",
                        code: "timeout",
                      })
                    }
                  >
                    Report synthetic timeout
                  </Button>
                  <Button
                    variant="secondary"
                    isDisabled={!transport.canPublish}
                    onPress={transport.publishApplied}
                  >
                    Publish authoritative synthetic input
                  </Button>
                </>
              ) : null}
            </div>
            <dl className="mt-4 grid gap-2">
              <dt>Accepted query</dt>
              <dd>
                <output
                  aria-label="Accepted query"
                  className="break-all font-mono text-xs"
                >
                  {canonicalJson(state.query)}
                </output>
              </dd>
              <dt>Selected IDs (not loaded objects)</dt>
              <dd>
                <output aria-label="Selected IDs">
                  {Object.entries(state.selection)
                    .filter(([, selected]) => selected)
                    .map(([id]) => id)
                    .join(", ") || "none"}
                </output>
              </dd>
              <dt>Visible column policy</dt>
              <dd>
                <output aria-label="Column visibility">
                  {canonicalJson(state.columns.visibility)}
                </output>
              </dd>
            </dl>
          </details>
        </div>
      </main>
    </I18nProvider>
  );
}

function NumericOperand(editor: FilterCustomEditorProps<TransactionSchema>) {
  const [text, setText] = useState(
    typeof editor.value === "number" ? String(editor.value) : "",
  );
  if (editor.operator.cardinality === "range") {
    const pair = Array.isArray(editor.value) ? editor.value : ["", ""];
    return (
      <div className="flex flex-wrap gap-2">
        {[0, 1].map((index) => (
          <label key={index}>
            {index === 0 ? "From" : "To"}
            <input
              aria-label={index === 0 ? "From" : "To"}
              disabled={editor.isDisabled}
              value={String(pair[index] ?? "")}
              onChange={(event) => {
                const next = [...pair];
                next[index] =
                  event.target.value === "" ? "" : Number(event.target.value);
                editor.onChange(next);
              }}
            />
          </label>
        ))}
      </div>
    );
  }
  return (
    <label>
      Numeric value
      <input
        aria-label="Custom numeric value"
        disabled={editor.isDisabled}
        className="rounded border border-border bg-surface px-3 py-2"
        value={text}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          const value = Number(raw);
          editor.onChange(
            raw === "" ? undefined : Number.isFinite(value) ? value : raw,
          );
        }}
      />
    </label>
  );
}
function transactionTools(
  app: ExampleOwner<TransactionSchema, Transaction>,
): NonNullable<DataTableProps<TransactionSchema, Transaction>["tools"]> {
  return {
    search: { messages: { label: "Search descriptions" } },
    tabs: {
      tabs: { posted: { label: "Posted" }, draft: { label: "Draft" } },
      neutralTab: { label: "All records" },
      children: null,
    },
    date: {
      presets: [
        {
          id: "today",
          label: "November 25 UTC",
          date: {
            operator: "date.between",
            value: [
              { kind: "day", value: "2026-11-25" },
              { kind: "day", value: "2026-11-25" },
            ],
          },
        },
      ],
    },
    builder: {
      registry: exampleOperators,
      fields: {
        amount: {
          label: "Amount",
          operatorLabels: { "example.multiple-of": "Multiple of" },
          renderEditor: (editor) => <NumericOperand {...editor} />,
        },
        reference: { label: "Reference (hidden column)" },
        account: {
          label: "Account",
          asyncOptions: {
            idType: "number",
            source: app.numericOptions.source,
            onRequest: app.numericOptions.onRequest,
            nextPageKey: app.numericOptions.nextPageKey,
          },
        },
        tags: {
          label: "Tags",
          choices: [
            { id: "review", label: "Review" },
            { id: "local", label: "Local" },
          ],
        },
        cleared: { label: "Cleared" },
        bookingDay: { label: "Booking day" },
      },
    },
  };
}
function useTransactionScenario(
  app: ExampleOwner<TransactionSchema, Transaction>,
  scenario: TransactionScenario,
) {
  useEffect(() => {
    app.dispatch({ type: "builder.clear" });
    if (scenario === "plain") return;
    if (scenario === "entities") {
      app.numericOptions.setMode("fail-once");
      app.dispatch({
        type: "builder.commit",
        rule: {
          id: "account-zero",
          field: "account",
          operator: "enum.is",
          value: 0,
        },
      });
      return;
    }
    app.dispatch({
      type: "builder.commit",
      rule: {
        id: "amount-positive",
        field: "amount",
        operator: "number.gt",
        value: 10,
      },
    });
    app.dispatch({
      type: "builder.commit",
      rule: { id: "reference-empty", field: "reference", operator: "empty" },
    });
    app.dispatch({ type: "builder.join", join: "or" });
    if (scenario === "families") {
      app.dispatch({
        type: "builder.commit",
        rule: {
          id: "tag-review",
          field: "tags",
          operator: "set.anyOf",
          value: ["review"],
        },
      });
      app.dispatch({
        type: "builder.commit",
        rule: {
          id: "uncleared",
          field: "cleared",
          operator: "boolean.isFalse",
        },
      });
      app.dispatch({
        type: "builder.commit",
        rule: {
          id: "booked",
          field: "bookingDay",
          operator: "date.on",
          value: { kind: "day", value: "2026-11-25" },
        },
      });
    }
    if (scenario === "independent") {
      app.dispatch({ type: "search.commit", search: "Transfer" });
      app.dispatch({ type: "tabs.change", tabId: "posted" });
      app.dispatch({
        type: "date.commit",
        date: {
          operator: "date.between",
          value: [
            { kind: "day", value: "2026-11-25" },
            { kind: "day", value: "2026-11-25" },
          ],
        },
      });
    }
  }, [app, scenario]);
}
function TransactionHost({
  flavor,
  scenario = "plain",
  ...appearance
}: Appearance & {
  flavor: "full" | "grouped" | "controlled" | "reorder";
  scenario?: TransactionScenario;
}) {
  const [app] = useState(() =>
    createExampleOwner(
      transactionDefinition({
        full: true,
        grouped: flavor === "grouped",
        rows: flavor === "reorder",
        utilities: utility<Transaction>(),
      }),
      transactions,
      {
        id: `transactions-${flavor}`,
        manualRows: flavor === "reorder",
        controlled: flavor === "controlled",
      },
    ),
  );
  useTransactionScenario(app, scenario);
  const tools = useMemo(() => transactionTools(app), [app]);
  return (
    <Surface
      {...appearance}
      app={app}
      title="Synthetic transactions"
      rowHeader="description"
      label={transactionLabel}
      full
      tools={tools}
      body={(context, driver) => (
        <TransactionDetails context={context} owner={app} driver={driver} />
      )}
    >
      {flavor === "grouped" ? (
        <p>
          Private installed RAC profile. Move data leaves inside Values only;
          utilities remain fixed. Drag is not enabled.
        </p>
      ) : null}
    </Surface>
  );
}
export function MinimalWorkbench(props: Appearance) {
  const [app] = useState(() =>
    createExampleOwner(minimalTransactionDefinition(), transactions, {
      id: "minimal-transactions",
    }),
  );
  return (
    <Surface
      {...props}
      app={app}
      title="Synthetic transactions"
      rowHeader="description"
      label={transactionLabel}
      tools={{
        builder: {
          fields: {
            description: { label: "Description" },
            amount: { label: "Amount" },
          },
        },
      }}
    />
  );
}
export function TransactionsWorkbench(
  props: Appearance & { scenario?: TransactionScenario },
) {
  return <TransactionHost {...props} flavor="full" />;
}
export function GroupedWorkbench(props: Appearance) {
  return <TransactionHost {...props} flavor="grouped" />;
}
export function ControlledWorkbench(props: Appearance) {
  return <TransactionHost {...props} flavor="controlled" />;
}
export function ReorderWorkbench(props: Appearance) {
  return <TransactionHost {...props} flavor="reorder" />;
}
export function OwnerConflict() {
  const message = useMemo(ownerConflictDiagnostic, []);
  return (
    <section aria-label="Rejected configuration">
      <h2>Exclusive field ownership</h2>
      <p role="alert">{message}</p>
      <TransactionsWorkbench />
    </section>
  );
}
export function IndependentWorkbench(props: Appearance) {
  return (
    <div className="space-y-6">
      <TransactionsWorkbench {...props} />
      <InventoryWorkbench {...props} />
    </div>
  );
}
export function CustomerWorkbench(props: Appearance) {
  const [app] = useState(() =>
    createExampleOwner(
      customerDefinition({ utilities: utility<Customer>() }),
      customers,
      { id: "customers" },
    ),
  );
  const tools: NonNullable<DataTableProps<CustomerSchema, Customer>["tools"]> =
    {
      tabs: {
        tabs: { current: { label: "Current" }, paused: { label: "Paused" } },
        neutralTab: { label: "All customers" },
        children: null,
      },
      builder: {
        fields: {
          balance: { label: "Balance" },
          note: { label: "Note" },
          active: { label: "Active" },
          teams: {
            label: "Teams",
            choices: [
              { id: "north", label: "North" },
              { id: "south", label: "South" },
            ],
          },
        },
      },
    };
  return (
    <Surface
      {...props}
      app={app}
      title="Synthetic customers"
      rowHeader="name"
      label={customerLabel}
      full
      tools={tools}
      body={(context, driver) => (
        <CustomerDetails context={context} owner={app} driver={driver} />
      )}
    />
  );
}
export function InventoryWorkbench(props: Appearance) {
  const [app] = useState(() =>
    createExampleOwner(
      inventoryDefinition({ utilities: utility<InventoryItem>() }),
      inventory,
      { id: "inventory" },
    ),
  );
  const tools: NonNullable<
    DataTableProps<InventorySchema, InventoryItem>["tools"]
  > = {
    tabs: {
      tabs: {
        available: { label: "Available" },
        archived: { label: "Archived" },
      },
      neutralTab: { label: "All records" },
      children: null,
    },
    builder: {
      fields: {
        quantity: { label: "Quantity" },
        category: {
          label: "Category",
          choices: [
            { id: "equipment", label: "Equipment" },
            { id: "supplies", label: "Supplies" },
          ],
        },
        locations: {
          label: "Locations",
          choices: [
            { id: "0", label: "Location zero (string ID)" },
            { id: "shelf-b", label: "Shelf B" },
          ],
        },
        reserved: { label: "Reserved" },
        note: { label: "Note" },
      },
    },
  };
  return (
    <Surface
      {...props}
      app={app}
      title="Synthetic inventory"
      rowHeader="title"
      label={inventoryLabel}
      full
      tools={tools}
      body={(context, driver) => (
        <InventoryDetails context={context} owner={app} driver={driver} />
      )}
    />
  );
}
export function RecoveryWorkbench({
  scenario = "loading",
  ...appearance
}: Appearance & { scenario?: RecoveryScenario }) {
  const [app] = useState(() =>
    createExampleOwner(
      transactionDefinition({ full: true, utilities: utility<Transaction>() }),
      transactions,
      { id: "server-resource", server: true },
    ),
  );
  useEffect(() => {
    app.replaceRecords(
      scenario === "empty" || scenario === "unknown-empty" ? [] : transactions,
    );
    app.dispatch({
      type: "query.replace",
      update: createQuery(app.D.native.controllerDefinition.schema, {
        locale: "en-US",
        timeZone: "UTC",
      }),
    });
    if (scenario === "no-results")
      app.dispatch({
        type: "search.commit",
        search: "no matching synthetic description",
      });
    app.remote.begin();
    if (scenario === "loading") return;
    if (scenario === "initial-error") {
      app.remote.fail();
      return;
    }
    app.remote.succeed(
      scenario === "unknown-total" || scenario === "unknown-empty"
        ? "unknown"
        : "known",
      scenario === "empty"
        ? "dataset"
        : scenario === "unknown-empty"
          ? "unknown"
          : undefined,
    );
    if (scenario === "refreshing" || scenario === "refresh-error") {
      app.remote.begin();
      if (scenario === "refresh-error") app.remote.fail();
    }
  }, [app, scenario]);
  const tools = useMemo(() => transactionTools(app), [app]);
  return (
    <Surface
      {...appearance}
      app={app}
      title="Synthetic server recovery"
      rowHeader="description"
      label={transactionLabel}
      full
      server
      tools={tools}
      body={(context, driver) => (
        <TransactionDetails context={context} owner={app} driver={driver} />
      )}
    />
  );
}

/** Completion marker only; assertions exercise public DOM, never an app test port. */
export async function checkedPlay(
  element: HTMLElement,
  action: () => Promise<void>,
) {
  const surfaces = element.querySelectorAll<HTMLElement>(
    "[data-workbench-play]",
  );
  if (!surfaces.length) throw new Error("No actual workbench surface");
  for (const surface of surfaces) surface.dataset.workbenchPlay = "running";
  try {
    await action();
    for (const surface of surfaces) surface.dataset.workbenchPlay = "completed";
  } catch (error) {
    for (const surface of surfaces) surface.dataset.workbenchPlay = "exception";
    throw error;
  }
}
