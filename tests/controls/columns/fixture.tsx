import {
  StrictMode,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { I18nProvider } from "react-aria-components";
import { createRoot } from "react-dom/client";
import type { ColumnChooserMessages } from "../../../packages/heroui/src/columns/index.js";
import { ColumnChooser } from "../../../packages/heroui/src/columns/index.js";
import type { SortingMessages } from "../../../packages/heroui/src/sorting/index.js";
import { Sorting } from "../../../packages/heroui/src/sorting/index.js";
import type { QueryFor } from "../../../packages/react/src/contracts/index.js";
import { createQuery } from "../../../packages/react/src/contracts/index.js";
import type {
  ControlsInput,
  ControlsRequestBinding,
  StateProposal,
} from "../../../packages/react/src/index.js";
import {
  beginControlsRequest,
  createControlsAuthority,
  createNativeController,
  createResourceAdapter,
  projectControls,
  useNativeTable,
} from "../../../packages/react/src/index.js";
import type { RecordRow } from "./fixtures.js";
import { context, definition, records, schema } from "./fixtures.js";
import "./fixture.css";

const params = new URLSearchParams(location.search);
const rtl = params.has("rtl");
const locale = rtl ? "ar-EG" : "en-US";
document.documentElement.lang = rtl ? "ar" : "en";
document.documentElement.dir = rtl ? "rtl" : "ltr";
document.documentElement.classList.toggle("dark", params.has("dark"));
document.documentElement.dataset.theme = params.has("dark") ? "dark" : "light";
const chooserMessages: ColumnChooserMessages = {
  trigger: "الأعمدة",
  title: "الأعمدة المعروضة",
  required: "عمود مطلوب",
  finalVisible: "يجب إبقاء عمود بيانات واحد ظاهرًا",
  unavailable: "عناصر الأعمدة غير متاحة",
  disabled: "تغييرات الأعمدة معطلة",
};
const sortingMessages: SortingMessages = {
  trigger: "ترتيب",
  title: "الترتيب",
  priorities: "أولوية الترتيب",
  none: "لم يطبق أي ترتيب",
  ascending: "تصاعدي",
  descending: "تنازلي",
  remove: "إزالة",
  addAscending: "إضافة تصاعدي",
  addDescending: "إضافة تنازلي",
  hidden: "عمود مخفي",
  unavailable: "عناصر الترتيب غير متاحة",
  disabled: "تغييرات الترتيب معطلة",
  unsortable: "الترتيب غير مفعل لهذا العمود",
  singleOnly: "يدعم هذا العمود ترتيبًا منفردًا فقط",
  actionName: (action, label) => `${action}: ${label}`,
  priority: (position, label, direction, visibility) =>
    `${new Intl.NumberFormat(locale).format(Number(position))}. ${label}: ${direction}${visibility ? ` (${visibility})` : ""}`,
};

function createOwner() {
  const def = definition(!params.has("single"), !params.has("final"));
  let proposal: StateProposal<typeof schema> | null = null;
  const controller = createNativeController(def, {
    initial: { query: createQuery(schema, { locale, timeZone: "UTC" }) },
    now: () => 0,
    ...(params.has("controlled")
      ? { controlled: ["query", "columns"] as const }
      : {}),
    onRequest: (next) => {
      proposal = next;
    },
  });
  const foreign = createNativeController(def, {
    initial: { query: createQuery(schema, { locale, timeZone: "UTC" }) },
    now: () => 0,
  });
  const resource = createResourceAdapter<RecordRow, QueryFor<typeof schema>>(
    context,
  );
  let requestBinding: ControlsRequestBinding<typeof schema> | null = null;
  let snapshotBinding: ControlsRequestBinding<typeof schema> | null = null;
  let committed: ControlsInput<typeof schema, RecordRow> | null = null;
  let serial = 0;
  let subscriptions = 0;
  controller.subscribe(() => {
    subscriptions++;
  });
  const begin = () => {
    const start = beginControlsRequest(def, controller, resource, {
      ...resource.getSnapshot().context,
      queryKey: `query-${++serial}`,
      requestKey: `request-${serial}`,
    });
    if (!start) throw new Error("Fixture request unavailable");
    requestBinding = start.binding;
    return start.request;
  };
  const settle = () => {
    const request = resource.getSnapshot().request;
    if (!request) throw new Error("Fixture request missing");
    resource.succeed(request, {
      records,
      source: "fresh",
      page: { kind: "known", total: records.length },
      emptyKind: "unknown",
      receivedAt: "2026-11-24T00:00:00Z",
    });
    snapshotBinding = requestBinding;
  };
  begin();
  settle();
  return {
    definition: def,
    controller,
    foreign,
    resource,
    begin,
    settle,
    bindings: () => ({ request: requestBinding, snapshot: snapshotBinding }),
    commit: (input: ControlsInput<typeof schema, RecordRow>) => {
      committed = input;
    },
    read: () => {
      if (!committed) throw new Error("Fixture not committed");
      return committed;
    },
    accept: () => {
      if (proposal) controller.accept(proposal);
    },
    reject: () => {
      if (proposal) controller.reject(proposal);
    },
    subscriptions: () => subscriptions,
  };
}

interface FixtureAPI {
  state(): {
    sorting: readonly { readonly id: string; readonly desc: boolean }[];
    visibility: Readonly<Record<string, boolean>>;
    order: readonly string[];
    selection: Readonly<Record<string, boolean>>;
    page: number;
    locale: string;
    subscriptions: number;
    notices: readonly string[];
  };
  sort(sorting: QueryFor<typeof schema>["sorting"]): void;
  hide(visibility: Readonly<Record<string, boolean>>): void;
  select(): void;
  page(): void;
  accept(): void;
  reject(): void;
  loading(): void;
  fail(): void;
  scope(): void;
  access(): void;
  foreignTarget(): void;
  disabled(): void;
}
declare global {
  interface Window {
    columnFixture: Record<string, FixtureAPI>;
  }
}
window.columnFixture = {};

function Fixture({ id }: { readonly id: string }) {
  const [owner] = useState(createOwner);
  const [notices, setNotices] = useState<string[]>([]);
  const [disabled, setDisabled] = useState(params.has("disabled"));
  const [foreignTarget, setForeignTarget] = useState(false);
  const resource = useSyncExternalStore(
    owner.resource.subscribe,
    owner.resource.getSnapshot,
    owner.resource.getServerSnapshot,
  );
  const server = params.has("server");
  const originalView = useNativeTable(
    owner.definition,
    owner.controller,
    server
      ? {
          mode: "server",
          records: resource.snapshot?.records ?? [],
          pageInfo: resource.snapshot?.page ?? {
            kind: "unknown",
            hasNextPage: false,
          },
        }
      : { mode: "client", records },
  );
  const foreignView = useNativeTable(owner.definition, owner.foreign, {
    mode: "client",
    records,
  });
  const view = foreignTarget ? foreignView : originalView;
  const input: ControlsInput<typeof schema, RecordRow> = {
    native: view,
    expected: resource.context,
    source: server
      ? {
          mode: "server",
          resource: owner.resource,
          view: resource,
          bindings: owner.bindings(),
        }
      : { mode: "client", context: resource.context, records },
  };
  useLayoutEffect(() => {
    owner.commit(input);
  });
  const authority = useMemo(
    () =>
      createControlsAuthority({
        definition: owner.definition,
        controller: owner.controller,
        queryIdentity: owner.controller.getSnapshot().queryIdentity,
        context,
        readCommitted: owner.read,
        ...(server
          ? ({ mode: "server", resource: owner.resource } as const)
          : ({ mode: "client" } as const)),
      }),
    [owner, server],
  );
  useLayoutEffect(() => {
    window.columnFixture[id] = {
      state: () => {
        const state = owner.controller.getSnapshot();
        return {
          sorting: state.query.sorting,
          visibility: state.columns.visibility,
          order: state.columns.order,
          selection: state.selection,
          page: state.query.pagination.pageIndex,
          locale: state.query.locale,
          subscriptions: owner.subscriptions(),
          notices,
        };
      },
      sort: (sorting) => {
        owner.controller.dispatch({ type: "sorting.change", update: sorting });
      },
      hide: (visibility) => {
        owner.controller.dispatch({
          type: "columns.visibility",
          update: visibility,
        });
      },
      select: () => {
        owner.controller.dispatch({
          type: "selection.change",
          update: { a: true },
        });
      },
      page: () => {
        owner.controller.dispatch({
          type: "pagination.change",
          update: { pageIndex: 1, pageSize: 10 },
        });
      },
      accept: owner.accept,
      reject: owner.reject,
      loading: () => {
        owner.begin();
      },
      fail: () => {
        const request = owner.resource.getSnapshot().request;
        if (request) owner.resource.fail(request, "synthetic-offline");
      },
      scope: () => {
        owner.resource.setContext({ ...context, scopeKey: "two" });
      },
      access: () => {
        owner.resource.setContext({ ...context, access: false });
      },
      foreignTarget: () => {
        owner.commit({ ...owner.read(), native: foreignView });
        setForeignTarget(true);
      },
      disabled: () => {
        setDisabled(true);
      },
    };
  });
  const props = {
    definition: owner.definition,
    view,
    authority,
    presentation: projectControls(owner.definition, input),
    isDisabled: disabled,
    onResult: (notice: string) => {
      setNotices((before) => [...before, notice]);
    },
    ...(rtl
      ? {
          labels: {
            name: "الاسم",
            amount: "القيمة",
            fixed: "ثابت",
            note: "ملاحظة",
          },
        }
      : {}),
  };
  return (
    <section data-testid={id}>
      <h2>{rtl ? `جدول ${id}` : `Table ${id}`}</h2>
      <div className="tools">
        <Sorting {...props} {...(rtl ? { messages: sortingMessages } : {})} />
        <ColumnChooser
          {...props}
          {...(rtl ? { messages: chooserMessages } : {})}
        />
      </div>
      <div className="scroll">
        <table aria-label={`${id} simple fixture`}>
          <thead>
            <tr>
              {view.visibleColumns.map((column) => (
                <th key={column.id}>
                  {String(column.columnDef.header ?? column.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr key={row.id}>
                {view.visibleColumns.map((column) => (
                  <td key={column.id}>
                    {column.columnDef.meta?.utility
                      ? "—"
                      : String(row.getValue(column.id))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <pre data-testid={`${id}-state`}>
        {JSON.stringify({
          sorting: view.state.query.sorting,
          visibility: view.state.columns.visibility,
          notices,
        })}
      </pre>
    </section>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Fixture root missing");
createRoot(root).render(
  <StrictMode>
    <I18nProvider locale={locale}>
      <main>
        <h1>{rtl ? "عناصر الجدول" : "Column controls"}</h1>
        <Fixture id="a" />
        <Fixture id="b" />
      </main>
    </I18nProvider>
  </StrictMode>,
);
