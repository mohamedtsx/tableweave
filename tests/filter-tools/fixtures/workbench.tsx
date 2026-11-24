import type { FilterSearchMessages } from "@tableweave/heroui";
import {
  FilterDate,
  FilterSearch,
  FilterTabs,
  NativeCollection,
} from "@tableweave/heroui";
import type {
  MutationResult,
  ResourceAdapter,
  ResourceContext,
  ResourceInvalidation,
} from "@tableweave/react";
import {
  createResourceAdapter,
  useNativeTable,
  useTableweaveResource,
  useTableweaveState,
} from "@tableweave/react";
import type { QueryFor } from "@tableweave/react/contracts";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  I18nProvider,
  isRTL,
  useLocale,
} from "react-aria-components/I18nProvider";
import type { BuilderExample, FixtureRecord, FixtureSchema } from "./data.js";
import {
  acceptedDatePresets,
  builderExamples,
  builderFieldIds,
  completeRows,
  createFixtureController,
  entityNumberOptions,
  entityTextOptions,
  fixtureRegistry,
  nativeDefinition,
  optionContext,
  secondScopeRows,
} from "./data.js";
import type { OptionTransportMode } from "./ports.js";
import { createOptionDriver, createProposalPort } from "./ports.js";
import "./workbench.css";

type FixtureController = ReturnType<typeof createFixtureController>;
type NumberDriver = ReturnType<typeof createOptionDriver<number>>;
type TextDriver = ReturnType<typeof createOptionDriver<string>>;
// A deliberately partial application replacement, not a maintained dictionary.
const arabicSearchMessages = {
  label: "البحث في السجلات",
  placeholder: "ابحث في السجلات…",
  clearLabel: "مسح البحث",
  cancelled: "تم إلغاء تعديل البحث.",
} satisfies Partial<FilterSearchMessages>;
const defaultSearchMessages = {} satisfies Partial<FilterSearchMessages>;

function InheritedLocale() {
  const { locale, direction } = useLocale();
  return (
    <output
      aria-label="Inherited React Aria locale"
      data-testid="aria-locale"
      data-locale={locale}
      data-direction={direction}
    >
      {locale} · {direction}
    </output>
  );
}
interface Metrics {
  acceptedRequests: number;
  proposals: number;
  /** Passive setup/cleanup probes, not literal mounts under StrictMode replay. */
  resultsMounts: number;
  resultsCleanups: number;
  resourceInvalidations: number;
  visibleIds: readonly string[];
}
export interface FixtureBindings {
  readonly controller: FixtureController;
  readonly expectedContext: ResourceContext;
  readonly disabled: boolean;
  readonly invalidationKey: number;
  readonly onMutation: (result: MutationResult<FixtureSchema>) => void;
  readonly registry: typeof fixtureRegistry;
  readonly numberDriver: NumberDriver;
  readonly textDriver: TextDriver;
  readonly createRuleId: () => string;
}
export interface FixtureApi {
  readonly controller: FixtureController;
  readonly numberDriver: NumberDriver;
  readonly textDriver: TextDriver;
  readonly inspect: () => {
    readonly state: ReturnType<FixtureController["getSnapshot"]>;
    readonly context: ResourceContext;
    readonly metrics: Metrics;
    readonly resource: ReturnType<
      ResourceAdapter<FixtureRecord>["getSnapshot"]
    > | null;
  };
}
export interface WorkbenchProps {
  readonly controlled?: boolean;
  readonly label?: string;
  readonly embedded?: boolean;
  readonly initialScope?: "scope-a" | "scope-b";
  readonly locale?: string;
  readonly initialBuilder?: BuilderExample;
  readonly initialIndependent?: boolean;
  readonly optionTransport?: OptionTransportMode;
  readonly narrow?: boolean;
  /** Fixture composition slot; not a guessed Tableweave builder API. */
  readonly builderSlot?: (bindings: FixtureBindings) => ReactNode;
  readonly onReady?: (api: FixtureApi | null) => void;
}

function ProposalControls({
  controller,
  port,
}: {
  readonly controller: FixtureController;
  readonly port: ReturnType<typeof createProposalPort>;
}) {
  const pending = useSyncExternalStore(
    port.subscribe,
    port.getSnapshot,
    port.getServerSnapshot,
  );
  return (
    <section
      className="wp07-proposals"
      aria-label="Application-controlled proposal transport"
    >
      <p>Changes apply only when the application accepts them.</p>
      <button
        type="button"
        disabled={!pending}
        onClick={() => {
          if (!pending) return;
          controller.accept(pending);
          port.set(null);
        }}
      >
        Accept proposed change
      </button>
      <button
        type="button"
        disabled={!pending}
        onClick={() => {
          if (!pending) return;
          // This deliberately updates only the application transport controls. No
          // parent rerender/accepted-state notification is manufactured for reject.
          controller.reject(pending);
          port.set(null);
        }}
      >
        Silently reject proposed change
      </button>
    </section>
  );
}

function Results({
  controller,
  context,
  metrics,
  onInvalidate,
  attachResource,
}: {
  readonly controller: FixtureController;
  readonly context: ResourceContext;
  readonly metrics: Metrics;
  readonly onInvalidate: (event: ResourceInvalidation) => void;
  readonly attachResource: (
    resource: ResourceAdapter<FixtureRecord> | null,
  ) => void;
}) {
  const records = context.access
    ? context.scopeKey === "scope-a"
      ? completeRows
      : secondScopeRows
    : [];
  const view = useNativeTable(nativeDefinition, controller, {
    mode: "client",
    records,
  });
  const [resource] = useState(() =>
    createResourceAdapter<FixtureRecord>(context, { onInvalidate }),
  );
  const resourceView = useTableweaveResource(resource, context);
  const committedProjection = useRef<{
    readonly query: QueryFor<FixtureSchema>;
    readonly records: readonly FixtureRecord[];
    readonly total: number;
    readonly emptyKind: "filtered" | "dataset";
  } | null>(null);
  const [local, setLocal] = useState(0);
  useLayoutEffect(() => {
    metrics.visibleIds = view.rows.map((row) => row.id);
    committedProjection.current = {
      query: view.state.query,
      records: view.rows.map((row) => row.original),
      total: view.native.getFilteredRowModel().rows.length,
      emptyKind: records.length ? "filtered" : "dataset",
    };
  }, [metrics, view.rows, view.state.query, view.native, records.length]);
  useEffect(() => {
    metrics.resultsMounts++;
    return () => {
      metrics.resultsCleanups++;
    };
  }, [metrics]);
  const { queryIdentity, evaluatedAt } = view.state;
  const { definitionKey, scopeKey, access } = context;
  useEffect(() => {
    if (!access) return;
    const projected = committedProjection.current;
    if (!projected) return;
    // Application-owned synchronous settlement of the actual native projection,
    // not another filtering engine, fetch cache, request service or server page.
    const token = resource.begin({
      definitionKey,
      scopeKey,
      queryKey: queryIdentity,
      requestKey: `${queryIdentity}:${evaluatedAt}`,
      query: projected.query,
    });
    if (token)
      resource.succeed(token, {
        source: "fresh",
        records: projected.records,
        page: { kind: "known", total: projected.total },
        emptyKind: projected.emptyKind,
        receivedAt: "2025-03-09T17:00:00.123Z",
      });
    // Input is immutable and changes only with scope/access; row processing is
    // keyed by the accepted query identity. Selection/presentation is data-only.
  }, [
    resource,
    controller,
    definitionKey,
    scopeKey,
    access,
    queryIdentity,
    evaluatedAt,
  ]);
  useEffect(() => {
    attachResource(resource);
    return () => attachResource(null);
  }, [resource, attachResource]);
  return (
    <section
      className="wp07-results"
      aria-label="Actual native results"
      data-resource-kind={resourceView.kind}
    >
      <div className="wp07-result-heading">
        <output data-testid="native-ids" aria-label="Visible native record IDs">
          <bdi>{view.rows.map((row) => row.id).join(",") || "none"}</bdi>
        </output>
        <button type="button" onClick={() => setLocal((value) => value + 1)}>
          Results local state {local}
        </button>
        <button
          type="button"
          disabled={!context.access || view.rows.length === 0}
          onClick={() => view.selectPage(true)}
        >
          Select visible records
        </button>
      </div>
      <div className="wp07-table-scroll">
        <NativeCollection
          view={view}
          label="Synthetic filter results"
          rowHeaderColumnId="description"
          selectionColumnId="selection"
          columnTextValue={(column) =>
            String(column.columnDef.header ?? column.id)
          }
          rowTextValue={(row) => row.original.description}
          cellTextValue={(cell) => String(cell.getValue() ?? "Empty")}
        />
      </div>
      {view.rows.length === 0 ? (
        <p role="status">
          {context.access
            ? "No rows match these accepted filters."
            : "Synthetic access is unavailable."}
        </p>
      ) : null}
    </section>
  );
}

export function FilterWorkbench(props: WorkbenchProps) {
  const Surface = props.embedded ? "section" : "main";
  const locale = props.locale ?? "en-US";
  const metrics = useRef<Metrics>({
    acceptedRequests: 0,
    proposals: 0,
    resultsMounts: 0,
    resultsCleanups: 0,
    resourceInvalidations: 0,
    visibleIds: [],
  }).current;
  const [proposalPort] = useState(createProposalPort);
  const [controller] = useState(() =>
    createFixtureController(
      {
        ...(props.controlled
          ? {
              controlled: ["query"] as const,
              onRequest(proposal) {
                metrics.proposals++;
                proposalPort.set(proposal);
              },
            }
          : {}),
        onQueryChange() {
          metrics.acceptedRequests++;
        },
      },
      locale,
      props.initialBuilder,
      props.initialIndependent,
    ),
  );
  const state = useTableweaveState(controller);
  const arabic = state.query.locale.startsWith("ar");
  const [context, setContext] = useState<ResourceContext>(() => ({
    definitionKey: state.definitionIdentity,
    scopeKey: props.initialScope ?? "scope-a",
    access: true,
  }));
  const committedContext = useRef(context);
  useLayoutEffect(() => {
    committedContext.current = context;
  }, [context]);
  const [numberDriver] = useState(() =>
    createOptionDriver(
      optionContext(context, "entityNumber"),
      entityNumberOptions,
      props.optionTransport,
    ),
  );
  const [textDriver] = useState(() =>
    createOptionDriver(
      optionContext(context, "entityText"),
      entityTextOptions,
      props.optionTransport,
    ),
  );
  const resourceRef = useRef<ResourceAdapter<FixtureRecord> | null>(null);
  const attachResource = useCallback(
    (resource: ResourceAdapter<FixtureRecord> | null) => {
      resourceRef.current = resource;
    },
    [],
  );
  const onInvalidate = useCallback(
    ({ next }: ResourceInvalidation) => {
      metrics.resourceInvalidations++;
      numberDriver.source.clear();
      numberDriver.source.setContext(optionContext(next, "entityNumber"));
      textDriver.source.clear();
      textDriver.source.setContext(optionContext(next, "entityText"));
      if (!controller.isDisposed()) {
        controller.dispatch({ type: "selection.cancel" });
        controller.dispatch({
          type: "details.change",
          update: { rowId: null },
        });
      }
    },
    [controller, metrics, numberDriver, textDriver],
  );
  const [invalidationKey, setInvalidationKey] = useState(0);
  const [mutations, setMutations] = useState(0);
  const ruleSequence = useRef(0);
  const createRuleId = useCallback(
    () => `fixture-rule-${++ruleSequence.current}`,
    [],
  );
  const onMutation = useCallback(
    (_result: MutationResult<FixtureSchema>) =>
      setMutations((value) => value + 1),
    [],
  );
  const api = useMemo<FixtureApi>(
    () => ({
      controller,
      numberDriver,
      textDriver,
      inspect: () => ({
        state: controller.getSnapshot(),
        context: committedContext.current,
        metrics: { ...metrics, visibleIds: [...metrics.visibleIds] },
        resource: resourceRef.current?.getSnapshot() ?? null,
      }),
    }),
    [controller, numberDriver, textDriver, metrics],
  );
  useEffect(() => {
    props.onReady?.(api);
    return () => props.onReady?.(null);
  }, [api, props.onReady]);
  const selected = Object.values(state.selection).filter(Boolean).length;
  const bindings: FixtureBindings = {
    controller,
    expectedContext: context,
    disabled: selected > 0,
    invalidationKey,
    onMutation,
    registry: fixtureRegistry,
    numberDriver,
    textDriver,
    createRuleId,
  };
  function changeContext(next: ResourceContext) {
    // Explicit application context acceptance; not a render or an auth service.
    numberDriver.source.setContext(optionContext(next, "entityNumber"));
    textDriver.source.setContext(optionContext(next, "entityText"));
    resourceRef.current?.setContext(next);
    setContext(next);
  }
  function loadExample(example: BuilderExample) {
    onMutation(
      controller.dispatch({
        type: "query.replace",
        update: (query) => ({ ...query, builder: builderExamples[example] }),
      }),
    );
  }
  return (
    <I18nProvider locale={state.query.locale}>
      <Surface
        aria-label={props.label ?? "Synthetic filter workbench"}
        className={`wp07 ${props.narrow ? "wp07-narrow" : ""}`}
        dir={isRTL(state.query.locale) ? "rtl" : "ltr"}
        lang={state.query.locale}
      >
        <header className="wp07-heading">
          <h1>Filter tools workbench</h1>
          <p>
            Complete synthetic records · explicit New York clock ·
            accepted-state filtering
          </p>
          {arabic ? (
            <p data-testid="mixed-bidi">
              سجل تجريبي{" "}
              <bdi data-testid="bidi-token" dir="ltr">
                Alpha-0 / 123.45
              </bdi>{" "}
              — بيانات تركيبية.
            </p>
          ) : null}
        </header>
        {props.controlled ? (
          <ProposalControls controller={controller} port={proposalPort} />
        ) : null}
        <div className="wp07-external-tools">
          <FilterDate
            controller={controller}
            expectedContext={context}
            invalidationKey={invalidationKey}
            registry={fixtureRegistry}
            presets={acceptedDatePresets}
            onMutation={onMutation}
          />
        </div>
        <FilterTabs
          controller={controller}
          expectedContext={context}
          onMutation={onMutation}
          neutralTab={{ label: "All categories" }}
          tabs={{
            ready: {
              label: "Ready",
              count: {
                value: 5,
                description: "Complete synthetic dataset count",
              },
            },
            paused: {
              label: "Paused",
              count: {
                value: 3,
                description: "Complete synthetic dataset count",
              },
            },
          }}
        >
          <div className="wp07-panel-content">
            {selected > 0 ? (
              <div className="wp07-selection-slot">
                <p>
                  {selected} selected · explicit application slot illustration,
                  not WP-08 controls
                </p>
                <button
                  type="button"
                  onClick={() =>
                    controller.dispatch({ type: "selection.cancel" })
                  }
                >
                  Cancel selection
                </button>
              </div>
            ) : (
              <div className="wp07-normal-tools">
                {props.builderSlot?.(bindings)}
                <FilterSearch
                  controller={controller}
                  expectedContext={context}
                  disabled={selected > 0}
                  invalidationKey={invalidationKey}
                  onMutation={onMutation}
                  messages={
                    arabic ? arabicSearchMessages : defaultSearchMessages
                  }
                />
              </div>
            )}
            <Results
              controller={controller}
              context={context}
              metrics={metrics}
              onInvalidate={onInvalidate}
              attachResource={attachResource}
            />
          </div>
        </FilterTabs>
        <details className="wp07-inspector">
          <summary>
            Application fixture controls and accepted provenance
          </summary>
          <div className="wp07-fixture-actions">
            <button
              type="button"
              onClick={() =>
                onMutation(
                  controller.dispatch({
                    type: "query.replace",
                    update: (query) => ({
                      ...query,
                      locale: query.locale.startsWith("ar") ? "en-US" : "ar-EG",
                    }),
                  }),
                )
              }
            >
              {arabic ? "Use English locale" : "Use Arabic locale"}
            </button>
            <button type="button" onClick={() => loadExample("repeated")}>
              Load repeated-field example
            </button>
            <button type="button" onClick={() => loadExample("crossAny")}>
              Load cross-field Any example
            </button>
            <button type="button" onClick={() => loadExample("entities")}>
              Load numeric/text zero example
            </button>
            <button type="button" onClick={() => loadExample("none")}>
              Reset builder example
            </button>
            <button
              type="button"
              onClick={() =>
                changeContext({
                  ...context,
                  scopeKey:
                    context.scopeKey === "scope-a" ? "scope-b" : "scope-a",
                })
              }
            >
              Switch synthetic scope
            </button>
            <button
              type="button"
              onClick={() =>
                changeContext({ ...context, access: !context.access })
              }
            >
              {context.access
                ? "Simulate access loss"
                : "Restore synthetic access"}
            </button>
            <button
              type="button"
              onClick={() => {
                resourceRef.current?.clear();
                setInvalidationKey((value) => value + 1);
              }}
            >
              Invalidate transient tools
            </button>
            <button
              type="button"
              onClick={() =>
                controller.dispatch({
                  type: "columns.visibility",
                  update: (visibility) => ({
                    ...visibility,
                    note: visibility.note === false,
                  }),
                })
              }
            >
              Toggle note column
            </button>
          </div>
          <dl className="wp07-provenance">
            <dt>Inherited React Aria locale</dt>
            <dd>
              <InheritedLocale />
            </dd>
            <dt>Configured builder fields</dt>
            <dd data-testid="builder-fields">{builderFieldIds.join(",")}</dd>
            <dt>Accepted search</dt>
            <dd data-testid="accepted-search">
              {state.query.search || "(empty)"}
            </dd>
            <dt>Accepted tab</dt>
            <dd data-testid="accepted-tab">{state.query.tabId ?? "neutral"}</dd>
            <dt>Accepted date</dt>
            <dd data-testid="accepted-date">
              {JSON.stringify(state.query.date)}
            </dd>
            <dt>Accepted query changes</dt>
            <dd data-testid="accepted-requests">{metrics.acceptedRequests}</dd>
            <dt>Observed submissions</dt>
            <dd data-testid="observed-submissions">{mutations}</dd>
          </dl>
          <pre data-testid="accepted-query" dir="ltr">
            {JSON.stringify(state.query, null, 2)}
          </pre>
          <pre data-testid="accepted-columns" dir="ltr">
            {JSON.stringify(state.columns)}
          </pre>
        </details>
      </Surface>
    </I18nProvider>
  );
}
