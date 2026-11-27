import {
  Component,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { I18nProvider } from "react-aria/I18nProvider";
import { createRoot } from "react-dom/client";
import type { CollectionMessages } from "../../../packages/heroui/src/table/collection-messages.js";
import { ControlledCollection } from "../../../packages/heroui/src/table/controlled-collection.js";
import {
  NativeCollection,
  type NativeCollectionProps,
} from "../../../packages/heroui/src/table/native-collection.js";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import type { StateProposal } from "../../../packages/react/src/controller/types.js";
import {
  beginControlsRequest,
  createControlsAuthority,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import type {
  ControlsInput,
  ControlsRequestBinding,
} from "../../../packages/react/src/presentation/types.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import type { ResourceContext } from "../../../packages/react/src/resource/types.js";
import {
  createNativeController,
  defineNativeTable,
  useNativeTable,
} from "../../../packages/react/src/tanstack/index.js";
import type {
  NativeCell,
  NativeColumn,
  NativeRow,
} from "../../../packages/react/src/tanstack/types.js";

const params = new URLSearchParams(location.search);
interface Item {
  id: string;
  name: string;
  score: number;
  eligible: boolean;
}
const records: readonly Item[] = [
  { id: "a", name: "Alpha", score: 3, eligible: true },
  { id: "b", name: "Beta", score: 1, eligible: params.has("all-eligible") },
  { id: "c", name: "Gamma", score: 2, eligible: true },
  { id: "d", name: "Delta", score: 4, eligible: true },
];
const schema = defineQuerySchema({
  id: "collection-controls",
  version: 1,
  sorting: { multi: true },
  pagination: { defaultSize: 3, sizes: [3, 10] },
  fields: {
    name: { type: "text", owner: "builder", sort: true },
    score: { type: "number", owner: "builder", sort: true },
  },
});
const definition = defineNativeTable<typeof schema, Item>({
  schema,
  selection: params.has("single")
    ? "single"
    : params.has("none")
      ? false
      : "multiple",
  multiSort: true,
  getRowId: (record) => record.id,
  isRowSelectable: (record) => record.eligible,
  columns: [
    { id: "selection", header: "Selection", meta: { utility: true } },
    {
      id: "data",
      header: "Data",
      columns: [
        {
          id: "name",
          header: "Name",
          accessorKey: "name",
          meta: { rowHeader: true },
        },
        {
          id: "metrics",
          header: "Metrics",
          columns: [
            {
              id: "score",
              header: "Score",
              accessorKey: "score",
              sortDescFirst: false,
            },
          ],
        },
      ],
    },
  ],
});
const context: ResourceContext = Object.freeze({
  definitionKey: "collection",
  scopeKey: "A",
  access: true,
});
const resource = createResourceAdapter<Item, QueryFor<typeof schema>>(context);
let pending: StateProposal<typeof schema> | undefined;
let requests = 0;
let flip = false;
let flips = 0;
const controller = createNativeController(definition, {
  initial: {
    query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    selection: definition.selectionMode === "multiple" ? { off: true } : {},
  },
  now: () => 0,
  controlled: params.has("controlled") ? ["query", "selection", "columns"] : [],
  onRequest(proposal) {
    pending = proposal;
    requests++;
  },
  // Adversarial test only: prove the batch's FINAL updater rechecks resource
  // authority even if an application violates the pure validation-port contract.
  validateCommand(command) {
    if (flip && command.type === "selection.change") {
      flip = false;
      flips++;
      resource.setContext({ ...context, access: false });
    }
  },
});
const alienController = createNativeController(definition, {
  initial: { query: controller.getSnapshot().query },
  now: () => 0,
});
const alienDefinition = defineNativeTable({
  schema,
  selection: definition.selectionMode,
  multiSort: true,
  getRowId: definition.getRowId,
  isRowSelectable: (record: Item) => record.eligible,
  columns: definition.columns,
});
let alienPortReads = 0;
let requestBinding: ControlsRequestBinding<typeof schema> | null = null;
let snapshotBinding: ControlsRequestBinding<typeof schema> | null = null;
function begin() {
  const current = resource.getSnapshot().context;
  const start = beginControlsRequest(definition, controller, resource, {
    ...current,
    queryKey: "opaque",
    requestKey: "opaque",
    retry() {},
  });
  if (start) requestBinding = start.binding;
  return start?.request;
}
function succeed() {
  const request = resource.getSnapshot().request;
  if (
    request &&
    resource.succeed(request, {
      source: "fresh",
      records: records.slice(0, 3),
      page: { kind: "known", total: 4 },
      emptyKind: "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    })
  )
    snapshotBinding = requestBinding;
}
if (params.has("server")) begin();
const textColumn = (column: NativeColumn<Item>) =>
  typeof column.columnDef.header === "string"
    ? column.columnDef.header
    : column.id;
const textRow = (row: NativeRow<Item>) => row.original.name;
const textCell = (cell: NativeCell<Item>) => String(cell.getValue() ?? "");
const translated: CollectionMessages = {
  pageCheckbox: "كل الصفوف الحالية",
  rowCheckbox: (text) => `اختيار ${text}`,
  sortButton: (text, direction, priority) =>
    `ترتيب ${text} ${direction ?? "بدون"} ${priority ?? ""}`,
  sortEntry: (id, direction, priority) => `${id} ${direction} رتبة ${priority}`,
  sortPriority: (priority) => ` [${priority}]`,
  sortOrderLabel: "ترتيب الأعمدة",
  sortSeparator: "؛ ",
  notSorted: "بدون ترتيب",
  selectedCount: (count) => `عدد الاختيارات ${count}`,
  subscribedCountLabel: "عدد مشترك",
  subscribedCount: (count) => `قيمة ${count}`,
  invalidColumns: "أعمدة غير صالحة",
  invalidRows: "صفوف غير صالحة",
  invalidRowHeader: "عنوان صف غير صالح",
  invalidSelectionColumn: "عمود اختيار غير صالح",
  missingCell: "خلية مفقودة",
};
class FixtureBoundary extends Component<
  { readonly children: ReactNode },
  { readonly error: string }
> {
  override state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  override render() {
    return this.state.error ? (
      <p role="alert">{this.state.error}</p>
    ) : (
      this.props.children
    );
  }
}

function App() {
  const [expected, setExpected] = useState(context);
  const [localRecords, setRecords] = useState(records);
  const [diagnostics, setDiagnostics] = useState(!params.has("diagoff"));
  const [frame, force] = useState(0);
  const root = useRef<HTMLElement>(null);
  const commits = useRef(0);
  useLayoutEffect(() => {
    commits.current++;
    root.current?.setAttribute("data-frame", String(commits.current));
  });
  const resourceView = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );
  useEffect(() => resource.connect(), []);
  const server = params.has("server");
  const view = useNativeTable(
    definition,
    controller,
    server
      ? {
          mode: "server",
          records: resourceView.snapshot?.records ?? [],
          pageInfo: resourceView.snapshot?.page ?? {
            kind: "unknown",
            hasNextPage: false,
          },
        }
      : { mode: "client", records: localRecords },
  );
  const alienView = useNativeTable(definition, alienController, {
    mode: "client",
    records: localRecords,
  });
  const input: ControlsInput<typeof schema, Item> = {
    native: view,
    expected,
    source: server
      ? {
          mode: "server",
          resource,
          view: resourceView,
          bindings: { request: requestBinding, snapshot: snapshotBinding },
        }
      : { mode: "client", context, records: localRecords },
  };
  const committed = useRef(input);
  useLayoutEffect(() => {
    committed.current = input;
  });
  const presentation = projectControls(definition, input);
  const suppliedPresentation = params.has("foreign-rows")
    ? { ...presentation, rows: alienView.rows }
    : presentation;
  const base = {
    definition,
    controller,
    queryIdentity: view.state.queryIdentity,
    context: expected,
    readCommitted: () => committed.current,
  };
  const authority = server
    ? createControlsAuthority({ ...base, mode: "server", resource })
    : createControlsAuthority({ ...base, mode: "client" });
  const suppliedAuthority = params.has("bad-owner")
    ? createControlsAuthority({
        ...base,
        controller: alienController,
        mode: "client",
        readCommitted() {
          alienPortReads++;
          throw new Error("synthetic-private-wrong-owner");
        },
      })
    : params.has("copied-owner")
      ? { ...authority }
      : params.has("proxy-owner")
        ? new Proxy(authority, {
            get() {
              alienPortReads++;
              throw new Error("synthetic-private-proxy");
            },
          })
        : authority;
  useLayoutEffect(() => {
    window.collection = {
      ids: () => Object.keys(controller.getSnapshot().selection),
      requests: () => requests,
      flips: () => flips,
      alienPortReads: () => alienPortReads,
      flipBatch: () => {
        flip = true;
      },
      stale(kind, target) {
        const node = document.querySelector<HTMLElement>(
          target === "row"
            ? 'tbody [data-key="a"] label'
            : target === "page"
              ? "thead label"
              : target === "cancel"
                ? '[role="grid"]'
                : "thead button",
        );
        const before = document
          .querySelector("main")
          ?.getAttribute("data-frame");
        if (kind === "selection")
          controller.dispatch({
            type: "selection.change",
            update: { fresh: true },
          });
        if (kind === "query")
          controller.dispatch({
            type: "pagination.change",
            update: { pageIndex: 1, pageSize: 3 },
          });
        if (kind === "scope")
          resource.setContext({ ...context, scopeKey: "B", access: false });
        const connected = node?.isConnected;
        const after = document
          .querySelector("main")
          ?.getAttribute("data-frame");
        if (target === "cancel")
          node?.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "Escape",
              bubbles: true,
              cancelable: true,
            }),
          );
        else node?.click();
        return {
          before,
          after,
          connected,
          ids: Object.keys(controller.getSnapshot().selection),
          query: controller.getSnapshot().query,
          revision: controller.getSnapshot().revision,
        };
      },
    };
  });
  const collectionProps: NativeCollectionProps<typeof schema, Item> = {
    view,
    label: "Items",
    rowHeaderColumnId: params.has("invalid-header") ? "selection" : "name",
    selectionColumnId: "selection",
    columnTextValue: textColumn,
    rowTextValue: textRow,
    cellTextValue: textCell,
    ...(!params.has("legacy")
      ? {
          controls: {
            definition: params.has("bad-definition")
              ? alienDefinition
              : definition,
            presentation: suppliedPresentation,
            authority: suppliedAuthority,
          },
        }
      : {}),
    ...(params.has("messages") ? { messages: translated } : {}),
    diagnostics,
  };
  const actions: readonly [string, () => void][] = [
    [
      "Begin",
      () => {
        begin();
        force(frame + 1);
      },
    ],
    [
      "Succeed",
      () => {
        succeed();
        force(frame + 1);
      },
    ],
    [
      "Fail",
      () => {
        const token = resource.getSnapshot().request;
        if (token) resource.fail(token, "offline");
      },
    ],
    [
      "Revoke",
      () => {
        resource.setContext({ ...context, access: false });
        setExpected({ ...context, access: false });
      },
    ],
    [
      "Mask before effect",
      () => setExpected({ ...context, scopeKey: "B", access: false }),
    ],
    [
      "Hide preferred",
      () =>
        controller.dispatch({
          type: "columns.visibility",
          update: { name: false },
        }),
    ],
    [
      "Hide all data",
      () =>
        controller.dispatch({
          type: "columns.visibility",
          update: { name: false, score: false },
        }),
    ],
    [
      "Hidden primary sort",
      () =>
        controller.dispatch({
          type: "sorting.change",
          update: [
            { id: "name", desc: false },
            { id: "score", desc: true },
          ],
        }),
    ],
    [
      "Next",
      () =>
        controller.dispatch({
          type: "pagination.change",
          update: { pageIndex: 1, pageSize: 3 },
        }),
    ],
    ["Clear IDs", () => controller.dispatch({ type: "selection.cancel" })],
    [
      "Accept",
      () => {
        if (pending) {
          controller.accept(pending);
          pending = undefined;
        }
      },
    ],
    [
      "Reject",
      () => {
        if (pending) {
          controller.reject(pending);
          pending = undefined;
          force(frame + 1);
        }
      },
    ],
    ["Diagnostics", () => setDiagnostics(!diagnostics)],
    [
      "Ineligible",
      () =>
        setRecords(localRecords.map((row) => ({ ...row, eligible: false }))),
    ],
  ];
  return (
    <main ref={root}>
      <h1>Controlled native collection</h1>
      <nav aria-label="Fixture actions">
        {actions.map(([name, action]) => (
          <button key={name} onClick={action} type="button">
            {name}
          </button>
        ))}
      </nav>
      <section aria-label="Collection surface">
        <FixtureBoundary>
          {params.has("utility-only") ? (
            <ControlledCollection
              label="Invalid collection"
              columns={[
                {
                  kind: "leaf",
                  id: "selection",
                  label: "Selection",
                  textValue: "Selection",
                  isSelection: true,
                },
              ]}
              rows={[]}
              selectedIds={new Set()}
              eligiblePageIds={[]}
              sorting={[]}
              messages={translated}
              onSelectedIdsChange={() => {}}
              onSort={() => {}}
            />
          ) : (
            <NativeCollection {...collectionProps} />
          )}
        </FixtureBoundary>
      </section>
      <output aria-label="Accepted IDs">{view.selectedIds.join(",")}</output>
      <output aria-label="Accepted sorting">
        {view.state.query.sorting
          .map((sort) => `${sort.id}:${sort.desc}`)
          .join(",")}
      </output>
    </main>
  );
}

declare global {
  interface Window {
    collection: {
      ids(): string[];
      requests(): number;
      flips(): number;
      alienPortReads(): number;
      flipBatch(): void;
      stale(
        kind: "selection" | "query" | "scope",
        target: "row" | "page" | "sort" | "cancel",
      ): {
        before: string | null | undefined;
        after: string | null | undefined;
        connected: boolean | undefined;
        ids: string[];
        query: QueryFor<typeof schema>;
        revision: number;
      };
    };
  }
}
const rtl = params.has("rtl");
document.documentElement.dir = rtl ? "rtl" : "ltr";
document.documentElement.lang = rtl ? "ar" : "en";
if (params.has("dark")) document.documentElement.classList.add("dark");
createRoot(document.getElementById("root") as HTMLElement).render(
  <I18nProvider locale={rtl ? "ar-EG" : "en-US"}>
    <App />
  </I18nProvider>,
);
