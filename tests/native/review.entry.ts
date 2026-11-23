import {
  createElement,
  Suspense,
  startTransition,
  useLayoutEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";
import type { StateProposal } from "../../packages/react/src/controller/types.js";
import {
  createNativeController,
  defineNativeTable,
  type NativeTableView,
  useNativeTable,
} from "../../packages/react/src/tanstack/index.js";

interface RecordRow {
  id: string;
  amount: number;
}
const schema = defineQuerySchema({
  id: "native-review",
  version: 1,
  fields: { amount: { type: "number", owner: "builder", sort: true } },
});
const definition = defineNativeTable<typeof schema, RecordRow>({
  schema,
  getRowId: (row) => row.id,
  selection: true,
  columns: [{ id: "amount", accessorKey: "amount" }],
});
let proposal: StateProposal<typeof schema> | undefined;
const controlled = new URLSearchParams(window.location.search).has(
  "controlled",
);
const controller = createNativeController(definition, {
  initial: { query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }) },
  now: () => 0,
  ...(controlled
    ? {
        controlled: ["query"] as const,
        onRequest: (next: StateProposal<typeof schema>) => {
          proposal = next;
        },
      }
    : {}),
});
let committed: NativeTableView<typeof schema, RecordRow> | undefined;
let initialNext: (() => void) | undefined;
let suspended = false;
let setNext: (next: boolean) => void = () => {};
let setSuspended: (next: boolean) => void = () => {};
let setRows: (rows: readonly RecordRow[]) => void = () => {};
const never = new Promise<void>(() => {});
declare global {
  interface Window {
    nativeReview: {
      suspend(): void;
      suspendMetadata(next: boolean): void;
      abandon(): void;
      ready(): boolean;
      suspended(): boolean;
      nativeRows(): string[];
      rawRows(): string[];
      selectVisible(): string | null;
      proposeSort(): void;
      rejectSort(): void;
      acceptSort(): void;
      sorting(): string[];
      metadata(next: boolean): void;
      capturedNext(): void;
      page(): number;
    };
  }
}
window.nativeReview = {
  suspend() {
    startTransition(() => {
      setRows([{ id: "b", amount: 2 }]);
      setSuspended(true);
    });
  },
  suspendMetadata(next: boolean) {
    startTransition(() => {
      setNext(next);
      setSuspended(true);
    });
  },
  abandon() {
    setRows([{ id: "a", amount: 1 }]);
    setSuspended(false);
  },
  ready: () => committed !== undefined,
  suspended: () => suspended,
  nativeRows: () =>
    committed?.native.getRowModel().rows.map((row) => row.id) ?? [],
  rawRows: () =>
    committed?.rows[0]?.table.getRowModel().rows.map((row) => row.id) ?? [],
  selectVisible() {
    try {
      committed?.rows[0]?.toggleSelected(true);
      return null;
    } catch (error) {
      return error instanceof Error ? error.name : "unknown";
    }
  },
  metadata: (next) => setNext(next),
  proposeSort: () => committed?.native.getColumn("amount")?.toggleSorting(),
  rejectSort: () => {
    if (proposal) controller.reject(proposal);
  },
  acceptSort: () => {
    if (proposal) controller.accept(proposal);
  },
  sorting: () =>
    committed?.native.atoms.sorting
      .get()
      .map((sort) => `${sort.id}:${sort.desc}`) ?? [],
  capturedNext: () => initialNext?.(),
  page: () => controller.getSnapshot().query.pagination.pageIndex,
};
function Fixture() {
  const [records, changeRecords] = useState<readonly RecordRow[]>([
    { id: "a", amount: 1 },
  ]);
  const [hasNextPage, changeNext] = useState(true);
  const [blocked, changeBlocked] = useState(false);
  setNext = changeNext;
  setSuspended = changeBlocked;
  setRows = changeRecords;
  const view = useNativeTable(definition, controller, {
    mode: "server",
    records,
    pageInfo: { kind: "unknown", hasNextPage },
  });
  useLayoutEffect(() => {
    committed = view;
    initialNext ??= view.nextPage;
  });
  if (blocked) {
    suspended = true;
    throw never;
  }
  return createElement(
    "main",
    null,
    createElement(
      "output",
      { id: "review-rows" },
      view.rows.map((row) => row.id).join(","),
    ),
    createElement(
      "output",
      { id: "review-next" },
      String(view.pagination.canNextPage),
    ),
    createElement(
      "output",
      { id: "review-selection" },
      view.selectedIds.join(","),
    ),
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  createElement(
    Suspense,
    { fallback: createElement("p", null, "pending") },
    createElement(Fixture),
  ),
);
