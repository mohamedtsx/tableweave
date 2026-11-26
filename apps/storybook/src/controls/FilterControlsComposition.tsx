import {
  ColumnChooser,
  FilterBuilder,
  type FilterBuilderProps,
  FilterDate,
  FilterSearch,
  FilterTabs,
  NativeCollection,
  Pagination,
  SelectionToolbar,
  Sorting,
} from "@tableweave/heroui";
import {
  type ControlsInput,
  createControlsAuthority,
  createNativeController,
  defineNativeTable,
  getControlsAuthorityOwner,
  projectControls,
  type ResourceContext,
  type StateProposal,
  type TableCommand,
  type TableController,
  useNativeTable,
} from "@tableweave/react";
import {
  canonicalJson,
  createQuery,
  defineQuerySchema,
  type QueryFor,
} from "@tableweave/react/contracts";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { I18nProvider, useLocale } from "react-aria-components/I18nProvider";
import "@heroui/styles/css";
import "@tableweave/heroui/styles.css";
import "./FilterControlsComposition.css";

export const compositionSchema = defineQuerySchema({
  id: "filter-controls-composition",
  version: 1,
  fields: {
    description: { type: "text", owner: "search", sort: true },
    status: { type: "enum", owner: "tabs", values: ["ready", "paused"] },
    day: { type: "date", owner: "date" },
    amount: { type: "number", owner: "builder", sort: true },
    team: { type: "enum", owner: "builder", values: ["red", "blue"] },
    note: { type: "text", owner: "builder", nullable: true },
  },
  tabs: [
    {
      id: "ready",
      rules: [{ field: "status", operator: "enum.is", value: "ready" }],
    },
    {
      id: "paused",
      rules: [{ field: "status", operator: "enum.is", value: "paused" }],
    },
  ],
  date: { mode: "single" },
  search: { debounceMs: 300 },
  sorting: { multi: true },
  pagination: { defaultSize: 3, sizes: [3, 6] },
});

export interface CompositionRecord {
  readonly id: string;
  readonly description: string;
  readonly status: "ready" | "paused";
  readonly day: string;
  readonly amount: number;
  readonly team: "red" | "blue";
  readonly note: string | null;
}

// Complete immutable synthetic client input. No resource adapter, copied server
// page, additional filtering/sorting/paging implementation or fabricated rows.
export const compositionRecords: readonly CompositionRecord[] = [
  {
    id: "a",
    description: "Alpha",
    status: "ready",
    day: "2026-11-24",
    amount: 10,
    team: "red",
    note: null,
  },
  {
    id: "b",
    description: "Beta",
    status: "ready",
    day: "2026-11-24",
    amount: 20,
    team: "blue",
    note: "",
  },
  {
    id: "c",
    description: "Gamma",
    status: "paused",
    day: "2026-11-25",
    amount: 30,
    team: "red",
    note: "memo",
  },
  {
    id: "d",
    description: "Alpha followup",
    status: "paused",
    day: "2026-11-24",
    amount: 40,
    team: "blue",
    note: null,
  },
  {
    id: "e",
    description: "Delta",
    status: "ready",
    day: "2026-11-23",
    amount: 50,
    team: "red",
    note: "memo",
  },
  {
    id: "f",
    description: "Alpha later",
    status: "ready",
    day: "2026-11-25",
    amount: 60,
    team: "blue",
    note: "",
  },
  {
    id: "g",
    description: "Eta",
    status: "paused",
    day: "2026-11-24",
    amount: 70,
    team: "red",
    note: "memo",
  },
  {
    id: "h",
    description: "Theta",
    status: "ready",
    day: "2026-11-24",
    amount: 80,
    team: "blue",
    note: "",
  },
];

export const compositionDatePresets = [
  {
    id: "nov24",
    label: "November 24 UTC",
    date: { operator: "date.on", value: { kind: "day", value: "2026-11-24" } },
  },
] as const satisfies readonly {
  readonly id: string;
  readonly label: string;
  readonly date: NonNullable<QueryFor<typeof compositionSchema>["date"]>;
}[];

const builderFields = {
  amount: { label: "Amount" },
  team: {
    label: "Team",
    choices: [
      { id: "red", label: "Red" },
      { id: "blue", label: "Blue" },
    ],
  },
  note: { label: "Note (hidden column)" },
} satisfies FilterBuilderProps<typeof compositionSchema>["fields"];

export interface FilterControlsCompositionProps {
  readonly id?: string;
  readonly controlled?: boolean;
  readonly initialRule?: boolean;
  readonly locale?: string;
  readonly dark?: boolean;
  readonly onReady?: (owner: CompositionOwner | null) => void;
}

interface ApplicationSnapshot {
  readonly proposal: StateProposal<typeof compositionSchema> | null;
  readonly queue: readonly string[];
  readonly feedback: string;
}

/** Application owner only. The original controller methods are never wrapped. */
export class CompositionOwner {
  readonly definition = defineNativeTable<
    typeof compositionSchema,
    CompositionRecord
  >({
    schema: compositionSchema,
    selection: "multiple",
    multiSort: true,
    getRowId: (record) => record.id,
    columns: [
      { id: "selection", header: "Selection", meta: { utility: true } },
      {
        id: "description",
        header: "Record",
        accessorKey: "description",
        meta: { rowHeader: true },
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        enableHiding: false,
      },
      {
        id: "amount",
        header: "Amount",
        accessorKey: "amount",
        sortDescFirst: false,
      },
      { id: "team", header: "Team", accessorKey: "team" },
      { id: "day", header: "Day", accessorKey: "day" },
      { id: "note", header: "Note", accessorKey: "note" },
    ],
  });
  readonly controller: TableController<typeof compositionSchema>;
  readonly context: ResourceContext;
  private committed: ControlsInput<
    typeof compositionSchema,
    CompositionRecord
  > | null = null;
  private app: ApplicationSnapshot = {
    proposal: null,
    queue: [],
    feedback: "",
  };
  private readonly listeners = new Set<() => void>();
  private ruleSequence = 0;

  constructor(
    readonly options: Required<
      Pick<
        FilterControlsCompositionProps,
        "id" | "controlled" | "initialRule" | "locale"
      >
    >,
  ) {
    this.controller = createNativeController(this.definition, {
      initial: {
        query: createQuery(compositionSchema, {
          locale: options.locale,
          timeZone: "UTC",
          builder: {
            join: "and",
            rules: options.initialRule
              ? [
                  {
                    id: "seed-amount",
                    field: "amount",
                    operator: "number.gte",
                    value: 20,
                  },
                ]
              : [],
          },
        }),
        columns: { visibility: { note: false } },
      },
      now: () => Date.parse("2026-11-24T12:00:00.000Z"),
      controlled: options.controlled ? ["query", "selection", "columns"] : [],
      onRequest: (proposal) => this.update({ proposal }),
    });
    this.context = Object.freeze({
      definitionKey: this.controller.getSnapshot().definitionIdentity,
      scopeKey: `composition:${options.id}`,
      access: true,
    });
  }

  private update(patch: Partial<ApplicationSnapshot>) {
    this.app = { ...this.app, ...patch };
    for (const listener of this.listeners) listener();
  }
  readonly getSnapshot = () => this.app;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  readonly createRuleId = () =>
    `${this.options.id}-rule-${++this.ruleSequence}`;
  commit(input: ControlsInput<typeof compositionSchema, CompositionRecord>) {
    this.committed = input;
  }
  readonly readCommitted = () => {
    if (!this.committed) throw new Error("Composition has not committed");
    return this.committed;
  };
  inspect() {
    return {
      state: this.controller.getSnapshot(),
      visibleIds: this.readCommitted().native.rows.map((row) => row.id),
      queue: this.app.queue,
    };
  }
  accept() {
    const proposal = this.app.proposal;
    if (!proposal) return;
    this.controller.accept(proposal);
    this.update({ proposal: null });
  }
  reject() {
    if (this.app.proposal) this.controller.reject(this.app.proposal);
    this.update({ proposal: null });
  }
  /** Genuine explicit application acceptance, not a fabricated user click. */
  external(command: TableCommand<typeof compositionSchema>) {
    this.reject();
    const result = this.controller.dispatch(command);
    if (result.status === "proposed") this.controller.accept(result.proposal);
    this.update({ proposal: null });
  }
  enqueue(ids: readonly string[], loaded: number, missing: number) {
    this.update({
      queue: [...new Set([...this.app.queue, ...ids])],
      feedback: `Queued ${ids.length} IDs: ${loaded} loaded, ${missing} unavailable.`,
    });
  }
}

function ProviderLocale() {
  const { locale, direction } = useLocale();
  return (
    <output
      data-testid="provider-locale"
      data-locale={locale}
      data-direction={direction}
    >
      {locale}
    </output>
  );
}

function CompositionSurface({
  owner,
  onReady,
}: {
  readonly owner: CompositionOwner;
  readonly onReady: FilterControlsCompositionProps["onReady"];
}) {
  const app = useSyncExternalStore(
    owner.subscribe,
    owner.getSnapshot,
    owner.getSnapshot,
  );
  const view = useNativeTable(owner.definition, owner.controller, {
    mode: "client",
    records: compositionRecords,
  });
  const input: ControlsInput<typeof compositionSchema, CompositionRecord> = {
    native: view,
    expected: owner.context,
    source: {
      mode: "client",
      context: owner.context,
      records: compositionRecords,
    },
  };
  useLayoutEffect(() => owner.commit(input));
  const presentation = projectControls(owner.definition, input);
  const authority = useMemo(
    () =>
      createControlsAuthority({
        definition: owner.definition,
        controller: owner.controller,
        queryIdentity: view.state.queryIdentity,
        context: owner.context,
        mode: "client",
        readCommitted: owner.readCommitted,
      }),
    [owner, view.state.queryIdentity],
  );
  const factoryOwner = getControlsAuthorityOwner(authority);
  const target = {
    definition: owner.definition,
    view,
    presentation,
    authority,
  };
  const root = useRef<HTMLElement>(null);
  const [local, setLocal] = useState(0);
  useEffect(() => {
    onReady?.(owner);
    return () => {
      owner.reject();
      onReady?.(null);
    };
  }, [owner, onReady]);
  const tools = {
    controller: owner.controller,
    expectedContext: owner.context,
    invalidationKey: 0,
  };
  const normal = (
    <div data-testid="composition-normal" className="fc-normal">
      <FilterBuilder
        controller={owner.controller}
        evaluationMode="client"
        expectedResourceContext={owner.context}
        invalidationKey={0}
        fields={builderFields}
        createRuleId={owner.createRuleId}
      />
      <FilterSearch {...tools} />
      <div className="fc-inline-controls">
        <Sorting {...target} id={`${owner.options.id}-sorting`} />
        <ColumnChooser {...target} id={`${owner.options.id}-columns`} />
      </div>
    </div>
  );
  return (
    <section
      ref={root}
      className="fc-composition"
      id={owner.options.id}
      data-owner-match={String(
        factoryOwner?.definition === owner.definition &&
          factoryOwner.controller === owner.controller,
      )}
    >
      <h2>{owner.options.id} filter/control composition</h2>
      <p>
        Complete synthetic client records. UI tools are not backend
        authorization.
      </p>
      <p className="fc-boundary">
        Raw filtering tools require the accepted coherent-context host
        precondition. Pre-render criteria revocation is not demonstrated here.
      </p>
      <div data-testid="composition-external">
        <FilterDate {...tools} presets={compositionDatePresets} />
      </div>
      <FilterTabs
        {...tools}
        neutralTab={{ label: "All records" }}
        tabs={{ ready: { label: "Ready" }, paused: { label: "Paused" } }}
      >
        <section
          data-testid="composition-results"
          aria-label={`${owner.options.id} results`}
        >
          <SelectionToolbar
            presentation={presentation}
            authority={authority}
            normal={normal}
            getRestoreFocusTarget={() =>
              root.current?.querySelector<HTMLButtonElement>(
                '[data-testid="composition-normal"] button',
              ) ?? null
            }
            actions={[
              {
                id: "queue",
                label: "Queue selected IDs",
                onAction: (selection) =>
                  owner.enqueue(
                    selection.selectedIds,
                    selection.loadedSelected.length,
                    selection.missingSelectedIds.length,
                  ),
              },
            ]}
          />
          <div className="fc-table-scroll">
            <NativeCollection
              view={view}
              label={`${owner.options.id} records`}
              rowHeaderColumnId="description"
              selectionColumnId="selection"
              columnTextValue={(column) =>
                typeof column.columnDef.header === "string"
                  ? column.columnDef.header
                  : column.id
              }
              rowTextValue={(row) => row.original.description}
              cellTextValue={(cell) => String(cell.getValue() ?? "Empty")}
              controls={{
                definition: owner.definition,
                presentation,
                authority,
              }}
              diagnostics={false}
            />
          </div>
          {!view.rows.length ? <p role="status">No matching records.</p> : null}
          <Pagination
            schema={compositionSchema}
            presentation={presentation}
            authority={authority}
          />
          <button type="button" onClick={() => setLocal((value) => value + 1)}>
            Results local state {local}
          </button>
        </section>
      </FilterTabs>
      <p role="status" aria-label="Queue feedback">
        {app.feedback}
      </p>
      <output aria-label="Queue size">{app.queue.length}</output>
      <details className="fc-application" open>
        <summary>
          Application scenario controls and accepted diagnostics
        </summary>
        <div className="fc-inline-controls">
          <button
            type="button"
            onClick={() =>
              owner.external({
                type: "selection.change",
                update: { unavailable: true },
              })
            }
          >
            Select only unavailable ID
          </button>
          <button
            type="button"
            onClick={() =>
              owner.external({
                type: "sorting.change",
                update: [
                  { id: "description", desc: false },
                  { id: "amount", desc: true },
                ],
              })
            }
          >
            Set two sort priorities
          </button>
          {owner.options.controlled ? (
            <>
              <button
                type="button"
                disabled={!app.proposal}
                onClick={() => owner.accept()}
              >
                Accept proposed change
              </button>
              <button
                type="button"
                disabled={!app.proposal}
                onClick={() => owner.reject()}
              >
                Reject proposed change
              </button>
            </>
          ) : null}
        </div>
        <output data-testid="composition-proposal">
          {app.proposal?.transition.reason ?? "none"}
        </output>
        <output data-testid="composition-ids">
          {view.rows.map((row) => row.id).join(",") || "none"}
        </output>
        <pre data-testid="composition-query">
          {canonicalJson(view.state.query)}
        </pre>
        <ProviderLocale />
      </details>
    </section>
  );
}

export function FilterControlsComposition(
  props: FilterControlsCompositionProps,
) {
  const [owner] = useState(
    () =>
      new CompositionOwner({
        id: props.id ?? "combined",
        locale: props.locale ?? "en-US",
        controlled: props.controlled ?? false,
        initialRule: props.initialRule ?? false,
      }),
  );
  const locale = owner.controller.getSnapshot().query.locale;
  return (
    <I18nProvider locale={locale}>
      <div
        className={props.dark ? "dark fc-theme" : "fc-theme"}
        data-theme={props.dark ? "dark" : "light"}
        lang={locale}
        dir={locale.startsWith("ar") ? "rtl" : "ltr"}
      >
        <CompositionSurface owner={owner} onReady={props.onReady} />
      </div>
    </I18nProvider>
  );
}
