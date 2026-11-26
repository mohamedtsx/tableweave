import type {
  ControlsInput,
  ControlsRequestBinding,
  ResourceRequest,
  StateProposal,
} from "@tableweave/react";
import {
  beginControlsRequest,
  createControlsAuthority,
  createNativeController,
  createResourceAdapter,
  defineNativeTable,
  getControlsRequestBinding,
  projectControls,
  useNativeTable,
} from "@tableweave/react";
import type { QueryFor } from "@tableweave/react/contracts";
import { createQuery, defineQuerySchema } from "@tableweave/react/contracts";
import {
  StrictMode,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { createRoot } from "react-dom/client";
import type { PaginationMessages } from "../../../packages/heroui/src/pagination/index.js";
import {
  Pagination,
  paginationMessages,
  usePaginationCorrection,
} from "../../../packages/heroui/src/pagination/index.js";
import "@heroui/styles/css";
import "../../../packages/heroui/src/pagination/styles.css";
import "./fixture.css";

const params = new URLSearchParams(location.search);
const scenario = params.get("scenario") ?? "known";
const controlled = params.has("controlled");
const auto = params.has("auto");
const rtl = params.has("rtl");
const schema = defineQuerySchema({
  id: "pager",
  version: 1,
  fields: { amount: { type: "number", owner: "builder", sort: true } },
  ...(params.has("custom")
    ? { pagination: { defaultSize: 2, sizes: [2, 4, 6] } }
    : {}),
});
interface RecordRow {
  id: string;
  amount: number;
}
const records: readonly RecordRow[] = Array.from({ length: 60 }, (_, i) => ({
  id: `row-${i}`,
  amount: i,
}));
const definition = defineNativeTable<typeof schema, RecordRow>({
  schema,
  selection: true,
  getRowId: (row) => row.id,
  columns: [{ id: "amount", accessorKey: "amount" }],
});
const initialQuery = createQuery(schema, {
  locale: rtl ? "ar-EG" : "en-US",
  timeZone: "UTC",
});
const commits: string[] = [];
let proposals: StateProposal<typeof schema>[] = [];
const controller = createNativeController(definition, {
  initial: {
    query: {
      ...initialQuery,
      pagination: {
        ...initialQuery.pagination,
        pageIndex: Number(params.get("page") ?? 0),
      },
    },
    selection: { "off-page": true },
  },
  now: () => 0,
  ...(controlled ? { controlled: ["query"] as const } : {}),
  onRequest: (proposal) => {
    proposals.push(proposal);
    if (params.has("callbackRejected"))
      throw new Error("Synthetic controlled rejection");
  },
  onCommit: (transition) => {
    commits.push(transition.reason);
  },
});
let context = {
  definitionKey: "pager:definition",
  scopeKey: "one",
  access: true,
};
let epoch = 0;
let requestBinding: ControlsRequestBinding<typeof schema> | null = null;
let snapshotBinding: ControlsRequestBinding<typeof schema> | null = null;
const resource = createResourceAdapter<RecordRow, QueryFor<typeof schema>>(
  context,
);
let transportCount = 0;
function retryTransport(request: ResourceRequest<QueryFor<typeof schema>>) {
  // Synthetic application transport, not a library request lifecycle. Settlement
  // is controlled by the test's succeed/fail port; no network claim is made.
  transportCount++;
  requestBinding = getControlsRequestBinding(
    definition,
    controller,
    resource,
    request,
  );
}
function begin() {
  const start = beginControlsRequest(definition, controller, resource, {
    ...context,
    queryKey: controller.getSnapshot().queryIdentity,
    requestKey: "synthetic-page",
    retry: retryTransport,
  });
  if (!start) throw new Error("Missing synthetic token");
  requestBinding = start.binding;
  return start.request;
}
function succeed(total = 60, hasNextPage?: boolean) {
  const token = resource.getSnapshot().request;
  if (!token) throw new Error("Missing synthetic token");
  const offset =
    token.query.pagination.pageIndex * token.query.pagination.pageSize;
  const loaded = records.slice(
    offset,
    Math.min(offset + token.query.pagination.pageSize, total),
  );
  resource.succeed(token, {
    source: "fresh",
    records: loaded,
    page:
      hasNextPage === undefined
        ? { kind: "known", total }
        : { kind: "unknown", hasNextPage },
    emptyKind: "unknown",
    receivedAt: "2026-11-24T00:00:00Z",
  });
  snapshotBinding = requestBinding;
}
const server = scenario !== "client";
if (server && scenario !== "null") {
  begin();
  succeed(
    scenario === "zero" ? 0 : Number(params.get("total") ?? 60),
    scenario === "unknown" ? params.get("next") !== "false" : undefined,
  );
}
if (scenario === "retained") {
  epoch++;
  controller.dispatch({
    type: "pagination.change",
    update: (previous) => ({ ...previous, pageIndex: 1 }),
  });
  begin();
  if (params.has("failed")) {
    const token = resource.getSnapshot().request;
    if (token) resource.fail(token, "offline");
  }
}
// One application owner, acquired outside the component. No UI/hook acquisition.
const disconnect = resource.connect();
let committed: ControlsInput<typeof schema, RecordRow>;
let trigger = () => {};
const arabic: PaginationMessages = {
  navigation: "التنقل بين الصفحات",
  rowsPerPage: "عدد الصفوف في الصفحة",
  previous: "الصفحة السابقة",
  next: "الصفحة التالية",
  retry: "إعادة المحاولة",
  noPages: "لا توجد صفحات",
  unavailable: "تفاصيل الصفحات غير متاحة بعد.",
  unknownRange: "نطاق الصفحة المعروضة غير متاح.",
  updating: "جار تحديث النتائج.",
  retained: "تظهر النتائج السابقة للصفحة المعروضة.",
  stale: "قد تكون النتائج المعروضة غير محدثة.",
  navigationUnavailable: "التنقل غير متاح حتى تصبح النتائج الحالية جاهزة.",
  firstPage: "لا توجد صفحة سابقة.",
  lastPage: "لا توجد صفحة تالية.",
  page: (page) => `الصفحة ${page}`,
  knownPage: (page, count) => `الصفحة ${page} من ${count}`,
  outOfRange: (page, count) =>
    `الصفحة المعروضة ${page} خارج نطاق ${count} صفحات.`,
  knownRange: (from, to, total) => `${from}–${to} من ${total} سجل`,
  unknownTotalRange: (from, to) => `${from}–${to} سجل`,
  unknownRangeKnownTotal: (total) =>
    `نطاق الصفحة المعروضة غير متاح. إجمالي ${total} سجل.`,
};
function Correction({
  presentation,
  authority,
}: {
  presentation: ReturnType<typeof projectControls<typeof schema, RecordRow>>;
  authority: ReturnType<
    typeof createControlsAuthority<typeof schema, RecordRow>
  >;
}) {
  usePaginationCorrection(controller, presentation, authority, {
    definition,
    context,
    epoch,
    readCurrent: () => ({ context, epoch }),
  });
  return null;
}
function App() {
  const [, tick] = useState(0);
  trigger = () => tick((value) => value + 1);
  const view = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );
  const native = useNativeTable(
    definition,
    controller,
    server
      ? {
          mode: "server",
          records: view.snapshot?.records ?? [],
          pageInfo: view.snapshot?.page ?? {
            kind: "unknown",
            hasNextPage: false,
          },
        }
      : { mode: "client", records },
  );
  const input: ControlsInput<typeof schema, RecordRow> = {
    native,
    expected: context,
    source: server
      ? {
          mode: "server",
          resource,
          view,
          bindings: { request: requestBinding, snapshot: snapshotBinding },
        }
      : { mode: "client", records, context },
  };
  useLayoutEffect(() => {
    committed = input;
  });
  const presentation = projectControls(definition, input);
  const base = {
    definition,
    controller,
    queryIdentity: native.state.queryIdentity,
    context,
    readCommitted: () => committed,
  };
  const authority = createControlsAuthority(
    server
      ? { ...base, mode: "server", resource }
      : { ...base, mode: "client" },
  );
  useLayoutEffect(() => {
    const invalidation = params.get("invalidateEffect");
    if (invalidation === "query" && epoch === 0) {
      epoch++;
      controller.dispatch({
        type: "pagination.change",
        update: (previous) => ({ ...previous, pageIndex: 2 }),
      });
      begin();
    } else if (invalidation === "scope" && epoch === 0) {
      epoch++;
      context = { ...context, scopeKey: "two" };
      resource.setContext(context);
    } else if (
      (invalidation === "metadata" || invalidation === "request-aba") &&
      epoch === 0
    ) {
      begin();
      if (invalidation === "request-aba") begin();
      succeed(32);
    } else if (params.has("invalidateEffect") && epoch === 0) epoch++;
  }, []);
  return (
    <I18nProvider locale={rtl ? "ar-EG" : "en-US"}>
      <main>
        <h1>{rtl ? "صفحات السجلات" : "Record pages"}</h1>
        <a id="outside" href="#diagnostic">
          {rtl ? "تشخيص الاختبار" : "Test diagnostics"}
        </a>
        <Pagination
          id="pager"
          schema={schema}
          presentation={presentation}
          authority={authority}
          messages={rtl ? arabic : paginationMessages}
          locale={rtl ? "ar-EG" : "en-US"}
          {...(!params.has("noRetry")
            ? {
                onRetry: () => {
                  authority.retry();
                },
              }
            : {})}
        />
        {auto ? (
          <Correction presentation={presentation} authority={authority} />
        ) : null}
        <p id="diagnostic">
          {JSON.stringify({
            pagination: native.state.query.pagination,
            selection: Object.keys(native.state.selection),
            sorting: native.state.query.sorting,
          })}
        </p>
      </main>
    </I18nProvider>
  );
}
const testApi = {
  begin,
  succeed,
  fail() {
    const token = resource.getSnapshot().request;
    if (token) resource.fail(token, "offline");
  },
  externalPage(pageIndex: number) {
    epoch++;
    controller.dispatch({
      type: "pagination.change",
      update: (previous) => ({ ...previous, pageIndex }),
    });
  },
  sort() {
    epoch++;
    controller.dispatch({
      type: "sorting.change",
      update: [{ id: "amount", desc: true }],
    });
  },
  changeScope() {
    epoch++;
    context = { ...context, scopeKey: "two" };
    resource.setContext(context);
  },
  tick: () => {
    trigger();
  },
  reject() {
    const last = proposals.at(-1);
    if (last) controller.reject(last);
    trigger();
  },
  accept() {
    const last = proposals.at(-1);
    if (last) controller.accept(last);
    trigger();
  },
  resetProposals() {
    proposals = [];
  },
  snapshot() {
    return {
      state: controller.getSnapshot(),
      proposals: proposals.length,
      commits: [...commits],
      epoch,
      transportCount,
      request: resource.getSnapshot().request,
      resource: resource.getSnapshot().kind,
    };
  },
  disconnect,
};
declare global {
  interface Window {
    pagerTest: typeof testApi;
  }
}
window.pagerTest = testApi;
document.documentElement.dir = rtl ? "rtl" : "ltr";
document.documentElement.lang = rtl ? "ar" : "en";
if (params.has("dark")) document.documentElement.classList.add("dark");
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  params.has("strict") ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  ),
);
