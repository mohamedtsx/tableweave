import { Button } from "@heroui/react/button";
import {
  DataTable,
  useDetailsAccessory,
  type DetailsRenderContext,
} from "@tableweave/heroui";
import { useDataTable } from "@tableweave/react";
import {
  StrictMode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "react-aria/I18nProvider";
import { transactionDefinition } from "../shared/definitions.js";
import {
  createExampleDetails,
  TransactionDetails,
  useExampleDetailSource,
} from "../shared/details.js";
import { createExampleOwner, type ExampleOwner } from "../shared/owner.js";
import { transactions, type Transaction } from "../shared/records.js";
import type { TransactionSchema } from "../shared/schemas.js";
import { transactionRecipeColumns } from "../recipes/custom-cells.js";
import { transactionRecipeTools } from "../recipes/custom-filter.js";
import {
  recipeLocale,
  SyntheticRecoveryControls,
} from "../recipes/locale-recovery.js";
import {
  reviewSyntheticRow,
  syntheticBulkActions,
} from "../recipes/row-bulk-actions.js";
import "./styles.css";

function createStyledOwner() {
  let owner: ExampleOwner<TransactionSchema, Transaction>;
  const definition = transactionDefinition({
    full: true,
    utilities: transactionRecipeColumns((id) => reviewSyntheticRow(owner, id)),
  });
  owner = createExampleOwner(definition, transactions, {
    id: "vite-transactions",
    server: true,
  });
  return owner;
}
export function StyledExample() {
  const [owner] = useState(createStyledOwner);
  const [driver] = useState(() => createExampleDetails(owner));
  const [rtl, setRtl] = useState(false),
    [dark, setDark] = useState(false);
  const own = useSyncExternalStore(
    owner.subscribe,
    owner.getSnapshot,
    owner.getServerSnapshot,
  );
  useSyncExternalStore(
    owner.remote.resource.subscribe,
    owner.remote.resource.getSnapshot,
    owner.remote.resource.getServerSnapshot,
  );
  useLayoutEffect(() => {
    const stop = owner.connect();
    owner.remote.begin();
    owner.remote.succeed();
    return stop;
  }, [owner]);
  useEffect(() => {
    owner.dispatch({
      type: "query.context",
      locale: rtl ? "ar-EG" : "en-US",
      timeZone: "UTC",
    });
  }, [owner, rtl]);
  const model = useDataTable(owner.D, owner.modelOptions());
  const detail = useExampleDetailSource(driver);
  const fallback = useRef<HTMLElement>(null);
  const renderBody = useCallback(
    (context: DetailsRenderContext<TransactionSchema, Transaction>) => (
      <TransactionDetails context={context} owner={owner} driver={driver} />
    ),
    [owner, driver],
  );
  const focusFallback = useCallback(
    () => fallback.current?.focus({ preventScroll: true }),
    [],
  );
  const options = useMemo(
    () => ({
      expected: detail.authority.context,
      authority: detail.authority,
      source: detail.source,
      port: driver.port,
      title: "Synthetic transaction details",
      beforeChange: driver.beforeChange,
      focusFallback,
      renderBody,
    }),
    [detail.authority, detail.source, driver, focusFallback, renderBody],
  );
  const accessory = useDetailsAccessory(model, options);
  const tools = useMemo(transactionRecipeTools, []),
    actions = useMemo(() => syntheticBulkActions(owner), [owner]);
  const collection = useMemo(
    () => ({
      label: "Synthetic transactions",
      rowHeaderColumnId: "description",
      selectionColumnId: "selection",
      rowTextValue: (row: { original: Transaction }) =>
        row.original.description,
      columnTextValue: (column: {
        id: string;
        columnDef: { header?: unknown };
      }) =>
        typeof column.columnDef.header === "string"
          ? column.columnDef.header
          : column.id,
      cellTextValue: (cell: { getValue(): unknown }) =>
        String(cell.getValue() ?? ""),
    }),
    [],
  );
  return (
    <I18nProvider locale={recipeLocale(rtl).locale}>
      <main
        className={`${dark ? "dark " : ""}min-h-screen bg-background p-4 text-sm text-foreground sm:p-8`}
        data-theme={dark ? "dark" : "light"}
        dir={rtl ? "rtl" : "ltr"}
      >
        <div className="mx-auto max-w-7xl space-y-4">
          <header className="space-y-2">
            <h1 className="text-lg font-semibold">Public Vite composition</h1>
            <p className="text-muted">
              Synthetic records and in-memory responses. No auth, persistence or
              drag adapter; WP-10/G-02 remains incomplete.
            </p>
            <a className="underline" href="./headless.html">
              Open the unstyled headless page
            </a>
          </header>
          <div className="flex flex-wrap gap-2">
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
            <Button
              variant="secondary"
              isDisabled={!own.access}
              onPress={owner.revoke}
            >
              Revoke application access
            </Button>
          </div>
          <section
            ref={fallback}
            tabIndex={-1}
            aria-label="Details return location"
          />
          <DataTable
            table={model}
            collection={collection}
            locale={recipeLocale(rtl)}
            neutralMessages={recipeLocale(rtl).neutralMessages}
            tools={tools}
            actions={actions}
            accessory={accessory}
            onRetry={() => {
              owner.remote.resource.retry();
            }}
          />
          <p role="status" aria-label="Application notice">
            {own.notice}
          </p>
          <SyntheticRecoveryControls owner={owner} />
        </div>
      </main>
    </I18nProvider>
  );
}
if (typeof document !== "undefined") {
  const element = document.getElementById("app");
  if (element)
    createRoot(element).render(
      <StrictMode>
        <StyledExample />
      </StrictMode>,
    );
}
