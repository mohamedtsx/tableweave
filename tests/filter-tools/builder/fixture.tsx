import type { StateProposal, TableCommand } from "@tableweave/react";
import {
  createNativeController,
  defineNativeTable,
  useNativeTable,
} from "@tableweave/react";
import type { ScalarId } from "@tableweave/react/contracts";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import type { FilterOption, OptionRequest } from "@tableweave/react/filters";
import {
  createOperatorRegistry,
  createOptionSource,
  defineOperator,
  projectOptionSourceView,
} from "@tableweave/react/filters";
import type { ReactNode } from "react";
import { StrictMode, Suspense, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { FilterBuilder } from "../../../packages/heroui/src/filters/filter-builder.js";
import { acceptedOptionIds } from "../../../packages/heroui/src/filters/option-owners.js";
import type { FilterCustomEditorProps } from "../../../packages/heroui/src/filters/types.js";

const minimum = defineOperator({
  id: "custom.minimum",
  labelKey: "minimum",
  types: ["number"],
  cardinality: "one",
  inverse: "custom.band",
  validate(value: unknown): value is { readonly minimum: number } {
    return (
      typeof value === "object" &&
      value !== null &&
      "minimum" in value &&
      typeof value.minimum === "number" &&
      Number.isFinite(value.minimum)
    );
  },
  evaluate(raw, value) {
    return (
      typeof raw === "number" &&
      typeof value === "object" &&
      value !== null &&
      "minimum" in value &&
      typeof value.minimum === "number" &&
      raw >= value.minimum
    );
  },
});
const band = defineOperator({
  id: "custom.band",
  labelKey: "band",
  types: ["number"],
  cardinality: "range",
  inverse: "custom.minimum",
  validate(value: unknown): value is readonly [number, number] {
    return (
      Array.isArray(value) &&
      value.length === 2 &&
      value.every(
        (item: unknown) => typeof item === "number" && Number.isFinite(item),
      ) &&
      value[0] <= value[1]
    );
  },
  evaluate(raw, value) {
    return (
      typeof raw === "number" &&
      Array.isArray(value) &&
      typeof value[0] === "number" &&
      typeof value[1] === "number" &&
      raw >= value[0] &&
      raw <= value[1]
    );
  },
});
const serverMinimum = defineOperator({
  id: "custom.server",
  labelKey: "serverMinimum",
  types: ["number"],
  cardinality: "one",
  validate(value: unknown): value is { readonly minimum: number } {
    return (
      typeof value === "object" &&
      value !== null &&
      "minimum" in value &&
      typeof value.minimum === "number" &&
      Number.isFinite(value.minimum)
    );
  },
});
const registry = createOperatorRegistry([minimum, band, serverMinimum]);
const schema = defineQuerySchema(
  {
    id: "builder-proof",
    version: 1,
    pagination: { defaultSize: 10, sizes: [2, 10] },
    fields: {
      name: {
        type: "text",
        owner: "builder",
        sort: true,
        operators: ["text.contains"],
      },
      note: { type: "text", owner: "builder", operators: ["text.contains"] },
      amount: { type: "number", owner: "builder", sort: true, nullable: true },
      status: { type: "enum", owner: "builder", values: [0, 1] },
      tags: { type: "set", owner: "builder", values: [0, 1, 2] },
      enabled: { type: "boolean", owner: "builder", nullable: true },
      happened: { type: "date", owner: "builder", nullable: true },
      timestamp: { type: "datetime", owner: "builder" },
      person: { type: "enum", owner: "builder", idType: "number" },
      custom: {
        type: "number",
        owner: "builder",
        operators: ["custom.minimum", "custom.band"],
      },
      serverAmount: {
        type: "number",
        owner: "builder",
        operators: ["custom.server"],
      },
      searchText: { type: "text", owner: "search" },
      tabState: { type: "enum", owner: "tabs", values: ["active", "inactive"] },
      bookedAt: { type: "date", owner: "date" },
      secret: { type: "text", owner: "none" },
    },
    tabs: [
      { id: "all", rules: [] },
      {
        id: "active",
        rules: [{ field: "tabState", operator: "enum.is", value: "active" }],
      },
    ],
    defaultTabId: "all",
  },
  registry,
);
const definition = defineNativeTable<typeof schema, RecordRow>({
  schema,
  getRowId: (row) => row.id,
  selection: true,
  evaluation: { registry },
  columns: [
    { id: "name", accessorKey: "name", enableHiding: false },
    { id: "amount", accessorKey: "amount" },
  ],
});
interface RecordRow {
  id: string;
  name: string;
  note: string;
  amount: number;
  status: ScalarId;
  tags: number[];
  enabled: boolean;
  happened: string;
  timestamp: string;
  person: number;
  custom: number;
  searchText: string;
  tabState: string;
  bookedAt: string;
  secret: string;
}
const records: readonly RecordRow[] = [
  {
    id: "a",
    name: "Alpha",
    note: "alpha",
    amount: 0,
    status: 0,
    tags: [0],
    enabled: false,
    happened: "2026-11-24",
    timestamp: "2026-11-24T08:00:00.123Z",
    person: 99,
    custom: 0,
    searchText: "Alpha",
    tabState: "active",
    bookedAt: "2026-11-24",
    secret: "x",
  },
  {
    id: "b",
    name: "Beta",
    note: "beta",
    amount: 10,
    status: 1,
    tags: [1, 2],
    enabled: true,
    happened: "2026-11-25",
    timestamp: "2026-11-25T08:00:00Z",
    person: 1,
    custom: 10,
    searchText: "Beta",
    tabState: "inactive",
    bookedAt: "2026-11-25",
    secret: "x",
  },
  {
    id: "c",
    name: "Gamma",
    note: "gamma",
    amount: 30,
    status: "1",
    tags: [2],
    enabled: true,
    happened: "2026-11-26",
    timestamp: "2026-11-26T08:00:00Z",
    person: 2,
    custom: 30,
    searchText: "Gamma",
    tabState: "active",
    bookedAt: "2026-11-26",
    secret: "x",
  },
];
let hold = false;
let throws = false;
let pending: StateProposal<typeof schema> | undefined;
let proposalCount = 0;
const controller = createNativeController(definition, {
  initial: {
    query: createQuery(schema, {
      locale: "en-US",
      timeZone: "America/New_York",
    }),
    selection: { offpage: true },
  },
  controlled: ["query"],
  now: () => 1795521600000,
  onRequest(proposal) {
    if (throws) throw new Error("private fixture failure");
    proposalCount++;
    pending = proposal;
    if (!hold)
      queueMicrotask(() => {
        controller.accept(proposal);
        if (pending === proposal) pending = undefined;
      });
  },
});
const initialContext = {
  definitionKey: "builder-definition",
  scopeKey: "one",
  access: true,
};
const optionInvalidations: string[] = [];
const source = createOptionSource<number>(
  { ...initialContext, fieldId: "person" },
  {
    onInvalidate: (event) => {
      optionInvalidations.push(event.reason);
    },
  },
);
const requests: OptionRequest[] = [];
function onRequest(request: OptionRequest) {
  requests.push(request);
  source.recoverSelectedLabels(request, [
    { id: 99, label: `Person scope ${request.scopeKey}` },
  ]);
}
// Test-only application ports. The regression invokes these and the still-live
// DOM control in one JavaScript turn, without a React flush or mock controller.
const builderReview = {
  mixedOptionUnion() {
    // Pure collection proof, not an attempt to admit mixed IDs into a schema
    // which declares a homogeneous field. No controller/query is mutated.
    const rules = Object.freeze([
      Object.freeze({ field: "mixed", value: Object.freeze([0, "0", 99]) }),
      Object.freeze({ field: "mixed", value: Object.freeze([0, "0"]) }),
      Object.freeze({ field: "other", value: Object.freeze([8]) }),
    ]);
    const ids = acceptedOptionIds(rules, "mixed");
    const context = { ...initialContext, fieldId: "mixed" };
    const proof = createOptionSource<ScalarId>(context);
    const disconnect = proof.connect();
    try {
      proof.setSelectedIds(context, ids);
      const selectedIds = projectOptionSourceView(
        proof.getSnapshot(),
        context,
        ids,
      ).selected.map((option) => option.id);
      let duplicateInputRejected = false;
      try {
        projectOptionSourceView(proof.getSnapshot(), context, [0, 0]);
      } catch {
        duplicateInputRejected = true;
      }
      return { ids, selectedIds, rules, duplicateInputRejected };
    } finally {
      disconnect();
      proof.dispose();
    }
  },
  beginOptions(term: string) {
    const token = source.begin({
      ...source.getSnapshot().context,
      term,
      pageKey: "first",
      retry: onRequest,
    });
    if (!token) throw new Error("Synthetic source did not begin");
    onRequest(token);
  },
  settleOptions(options: readonly FilterOption<number>[]) {
    const token = source.getSnapshot().request;
    if (!token) throw new Error("Missing synthetic option token");
    return source.succeed(token, { options, hasMore: true });
  },
  recoverCurrentLabel() {
    const token = source.getSnapshot().request;
    if (!token) throw new Error("Missing synthetic option token");
    return source.recoverSelectedLabels(token, [
      { id: 99, label: "Person scope one — refreshed" },
    ]);
  },
  dispatchAndAccept(command: TableCommand<typeof schema>) {
    const result = controller.dispatch(command);
    if (result.status === "proposed") {
      controller.accept(result.proposal);
      if (pending === result.proposal) pending = undefined;
    }
  },
  invalidateOptions() {
    source.setContext({
      ...source.getSnapshot().context,
      scopeKey: "external-scope",
    });
  },
  replaceAmount(value: number) {
    const rule = controller.getSnapshot().query.builder.rules[0];
    if (!rule) throw new Error("Missing synthetic rule");
    const result = controller.dispatch({
      type: "builder.commit",
      rule: { id: rule.id, field: "amount", operator: "number.eq", value },
    });
    if (result.status === "proposed") {
      controller.accept(result.proposal);
      if (pending === result.proposal) pending = undefined;
    }
  },
  acceptPending() {
    if (pending) {
      controller.accept(pending);
      pending = undefined;
    }
  },
  refreshOptions() {
    const current = source.getSnapshot();
    if (!current.request) throw new Error("Missing synthetic request");
    const token = source.begin({
      ...current.context,
      term: current.request.term,
      pageKey: current.request.pageKey,
      retry: onRequest,
    });
    if (token) onRequest(token);
  },
  inspect: () => ({
    proposalCount,
    pending: pending !== undefined,
    rules: controller.getSnapshot().query.builder.rules,
    requests: [...requests],
    options: source.getSnapshot(),
  }),
};
declare global {
  interface Window {
    builderReview: typeof builderReview;
  }
}
window.builderReview = builderReview;
function CustomEditor(props: FilterCustomEditorProps<typeof schema>) {
  const [first, setFirst] = useState(() =>
    typeof props.value === "object" &&
    props.value !== null &&
    "minimum" in props.value &&
    typeof props.value.minimum === "number"
      ? String(props.value.minimum)
      : Array.isArray(props.value)
        ? String(props.value[0])
        : "",
  );
  const [last, setLast] = useState(() =>
    Array.isArray(props.value) ? String(props.value[1]) : "",
  );
  function change(a: string, b: string) {
    if (!a.trim() || (props.operator.cardinality === "range" && !b.trim())) {
      props.onChange(undefined);
      return;
    }
    props.onChange(
      props.operator.cardinality === "range"
        ? [Number(a), Number(b)]
        : { minimum: Number(a) },
    );
  }
  return (
    <div>
      <label>
        Custom minimum
        <input
          value={first}
          onChange={(event) => {
            setFirst(event.target.value);
            change(event.target.value, last);
          }}
        />
      </label>
      {props.operator.cardinality === "range" && (
        <label>
          Custom maximum
          <input
            value={last}
            onChange={(event) => {
              setLast(event.target.value);
              change(first, event.target.value);
            }}
          />
        </label>
      )}
    </div>
  );
}
const suspendedWork = new Promise<void>(() => {});
function Gate({
  suspended,
  children,
}: {
  readonly suspended: boolean;
  readonly children: ReactNode;
}) {
  if (suspended) throw suspendedWork;
  return children;
}
function Fixture() {
  const rich = new URLSearchParams(location.search).has("rich");
  const arabic = new URLSearchParams(location.search).has("arabic");
  const [context, setContext] = useState(initialContext);
  const [epoch, setEpoch] = useState(0);
  const [observed, setObserved] = useState("");
  const [mode, setMode] = useState(false);
  const [showBuilder, setShowBuilder] = useState(true);
  const [suspended, setSuspended] = useState(false);
  const options = useSyncExternalStore(
    source.subscribe,
    source.getSnapshot,
    source.getServerSnapshot,
  );
  const view = useNativeTable<typeof schema, RecordRow>(
    definition,
    controller,
    new URLSearchParams(location.search).has("server")
      ? {
          mode: "server",
          records,
          pageInfo: { kind: "known", total: records.length },
        }
      : { mode: "client", records },
  );
  return (
    <main lang={arabic ? "ar" : undefined} dir={arabic ? "rtl" : undefined}>
      <h1>Filter builder proof</h1>
      <nav aria-label="Fixture controls">
        <button
          type="button"
          onClick={() => {
            hold = !hold;
            setMode(hold);
          }}
          aria-pressed={mode}
        >
          Hold proposals
        </button>
        <button
          type="button"
          onClick={() => {
            if (pending) {
              controller.accept(pending);
              pending = undefined;
            }
          }}
        >
          Accept proposal
        </button>
        <button
          type="button"
          onClick={() => {
            if (pending) {
              controller.reject(pending);
              pending = undefined;
            }
          }}
        >
          Reject proposal
        </button>
        <button
          type="button"
          onClick={() => {
            throws = !throws;
          }}
        >
          Toggle callback failure
        </button>
        <button
          type="button"
          onClick={() => {
            controller.dispatch({
              type: "selection.change",
              update: { offpage: true },
            });
            controller.dispatch({
              type: "pagination.change",
              update: { pageIndex: 0, pageSize: 2 },
            });
            // A size transition intentionally resets index; accept that proposal
            // before requesting page 1, rather than assuming combined semantics.
            queueMicrotask(() =>
              controller.dispatch({
                type: "pagination.change",
                update: { pageIndex: 1, pageSize: 2 },
              }),
            );
          }}
        >
          Seed selection and page
        </button>
        <button
          type="button"
          onClick={() =>
            controller.dispatch({
              type: "query.replace",
              update: (query) => ({
                ...query,
                search: "a",
                tabId: "active",
                sorting: [{ id: "amount", desc: true }],
                date: {
                  operator: "date.between",
                  value: [
                    { kind: "day", value: "2020-01-01" },
                    { kind: "day", value: "2030-01-01" },
                  ],
                },
                pagination: { pageIndex: 0, pageSize: 2 },
              }),
            })
          }
        >
          Seed independent criteria
        </button>
        <button
          type="button"
          onClick={() =>
            controller.dispatch({
              type: "builder.commit",
              rule: {
                id: "async-rule",
                field: "person",
                operator: "enum.anyOf",
                value: [99],
              },
            })
          }
        >
          Seed async rule
        </button>
        <button
          type="button"
          onClick={() => {
            const request = requests.at(-1);
            if (request)
              source.succeed(request, {
                options: [
                  {
                    id: 1,
                    label: `${request.term || "first"} one ${request.generation}`,
                  },
                  {
                    id: 2,
                    label: `${request.term || "first"} two ${request.generation}`,
                  },
                ],
                hasMore: true,
              });
          }}
        >
          Resolve latest options
        </button>
        <button
          type="button"
          onClick={() => {
            const request = requests[0];
            if (request)
              source.succeed(request, {
                options: [{ id: 8, label: "STALE PRIVATE LABEL" }],
                hasMore: false,
              });
          }}
        >
          Resolve oldest options
        </button>
        <button
          type="button"
          onClick={() => {
            const request = requests.at(-1);
            if (request) source.fail(request, "timeout");
          }}
        >
          Fail latest options
        </button>
        <button
          type="button"
          onClick={() => {
            const request = requests.at(-1);
            if (request)
              source.succeed(request, { options: [], hasMore: false });
          }}
        >
          Resolve empty options
        </button>
        <button
          type="button"
          onClick={() => {
            const request = requests.at(-1);
            if (request) source.fail(request, "access-lost");
          }}
        >
          Lose option access
        </button>
        <button
          type="button"
          onClick={() => {
            const next = {
              ...context,
              scopeKey: context.scopeKey === "one" ? "two" : "one",
            };
            source.setContext({ ...next, fieldId: "person" });
            setContext(next);
          }}
        >
          Change scope
        </button>
        <button
          type="button"
          onClick={() => {
            source.setContext({ ...context, access: false, fieldId: "person" });
            setContext({ ...context, access: false });
          }}
        >
          Lose access
        </button>
        <button
          type="button"
          onClick={() => {
            source.setContext({ ...context, access: true, fieldId: "person" });
            setContext({ ...context, access: true });
          }}
        >
          Restore access
        </button>
        <button type="button" onClick={() => setEpoch(epoch + 1)}>
          Invalidate builder drafts
        </button>
        <button
          type="button"
          onClick={() =>
            controller.dispatch({
              type: "pagination.change",
              update: { pageIndex: 1, pageSize: 10 },
            })
          }
        >
          External page change
        </button>
        <button
          type="button"
          onClick={() => {
            const rule = controller.getSnapshot().query.builder.rules[0];
            if (rule)
              controller.dispatch({
                type: "builder.commit",
                rule: {
                  id: rule.id,
                  field: "amount",
                  operator: "number.eq",
                  value: 30,
                },
              });
          }}
        >
          External rule change
        </button>
        <button
          type="button"
          onClick={() => {
            const rule = controller.getSnapshot().query.builder.rules[0];
            if (rule)
              controller.dispatch({ type: "builder.remove", ruleId: rule.id });
          }}
        >
          External rule removal
        </button>
        <button type="button" onClick={() => setShowBuilder(!showBuilder)}>
          Toggle builder mount
        </button>
        <button type="button" onClick={() => setSuspended(!suspended)}>
          Toggle builder Suspense
        </button>
        <button
          type="button"
          onClick={() => {
            document.documentElement.dir =
              document.documentElement.dir === "rtl" ? "ltr" : "rtl";
          }}
        >
          Toggle RTL
        </button>
      </nav>
      <Suspense fallback={<p>Builder suspended</p>}>
        <Gate suspended={suspended}>
          {showBuilder && (
            <FilterBuilder<typeof schema>
              controller={controller}
              evaluationMode={
                new URLSearchParams(location.search).has("server")
                  ? "server"
                  : "client"
              }
              expectedResourceContext={context}
              invalidationKey={epoch}
              registry={registry}
              messages={
                arabic
                  ? {
                      filters: "الفلاتر",
                      addRule: "إضافة شرط",
                      field: "الحقل",
                      operator: "المعامل",
                      value: "القيمة",
                      options: "خيارات الشرط",
                      all: "الكل",
                      any: "أي",
                      join: "مطابقة الشروط",
                      clear: "مسح",
                      clearLabel: "مسح شروط الفلاتر",
                    }
                  : {}
              }
              fields={{
                name: { label: "Name" },
                note: {
                  label: arabic ? "ملاحظة (حقل مخفي)" : "Note (hidden column)",
                  ...(arabic
                    ? { operatorLabels: { "text.contains": "يحتوي" } }
                    : {}),
                  ...(rich
                    ? {
                        formatValue: (rule) => (
                          <span>
                            <em>
                              {typeof rule.value === "string" ? rule.value : ""}
                            </em>
                            <span> note</span>
                          </span>
                        ),
                      }
                    : {}),
                },
                amount: {
                  label: arabic ? "المبلغ" : "Amount",
                  ...(arabic
                    ? { operatorLabels: { "number.eq": "يساوي" } }
                    : {}),
                  ...(rich
                    ? {
                        formatValue: (rule) => (
                          <span>
                            <strong>
                              {typeof rule.value === "number" ? rule.value : ""}
                            </strong>
                            <span> units</span>
                          </span>
                        ),
                      }
                    : {}),
                },
                status: {
                  label: "Status",
                  choices: [
                    { id: 0, label: "Zero" },
                    { id: 1, label: "Numeric one" },
                  ],
                },
                tags: {
                  label: "Tags",
                  choices: [
                    { id: 0, label: "Tag zero" },
                    { id: 1, label: "Tag one" },
                    { id: 2, label: "Tag two" },
                  ],
                },
                enabled: { label: "Enabled" },
                happened: { label: "Happened" },
                timestamp: { label: "Timestamp" },
                person: {
                  label: "Person",
                  asyncOptions: {
                    idType: "number",
                    source,
                    onRequest,
                    nextPageKey: (request) => `${request.pageKey}-next`,
                  },
                },
                custom: {
                  label: "Custom",
                  operatorLabels: {
                    "custom.minimum": "minimum",
                    "custom.band": "band",
                  },
                  renderEditor: (props) => <CustomEditor {...props} />,
                },
                serverAmount: {
                  label: "Server amount",
                  operatorLabels: { "custom.server": "server minimum" },
                  renderEditor: (props) => <CustomEditor {...props} />,
                },
              }}
              onMutation={(result, command) =>
                setObserved(`${command.type}:${result.status}`)
              }
            />
          )}
        </Gate>
      </Suspense>
      <output aria-label="Applied rules">
        {JSON.stringify(view.state.query.builder)}
      </output>
      <output aria-label="Result IDs">
        {view.rows.map((row) => row.id).join(",")}
      </output>
      <output aria-label="Independent criteria">
        {JSON.stringify({
          search: view.state.query.search,
          tabId: view.state.query.tabId,
          date: view.state.query.date,
          sorting: view.state.query.sorting,
          pageSize: view.state.query.pagination.pageSize,
        })}
      </output>
      <output aria-label="Accepted selection">
        {Object.keys(view.state.selection).join(",")}
      </output>
      <output aria-label="Accepted page">
        {view.state.query.pagination.pageIndex}
      </output>
      <output aria-label="Mutation observation">{observed}</output>
      <output aria-label="Option source state">{`${options.kind}/${options.active}/${options.context.scopeKey}/${options.context.access}/${options.request?.generation ?? "none"}`}</output>
      <output aria-label="Option selected labels">
        {JSON.stringify(options.selected)}
      </output>
      <output aria-label="Option invalidations">
        {optionInvalidations.join(",")}
      </output>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  new URLSearchParams(location.search).has("without-strict") ? (
    <Fixture />
  ) : (
    <StrictMode>
      <Fixture />
    </StrictMode>
  ),
);
