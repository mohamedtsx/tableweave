import { Button } from "@heroui/react/button";
import {
  StrictMode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { SelectionToolbar } from "../../../packages/heroui/src/selection/index.js";
import type {
  SelectionActionContext,
  SelectionToolbarMessages,
} from "../../../packages/heroui/src/selection/types.js";
import type { StateProposal } from "../../../packages/react/src/controller/types.js";
import {
  createControlsAuthority,
  getControlsRequestBinding,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import type {
  ControlsInput,
  ControlsRequestBinding,
} from "../../../packages/react/src/presentation/types.js";
import { useNativeTable } from "../../../packages/react/src/tanstack/index.js";
import {
  context,
  fixture,
  type RecordRow,
  records,
  type schema,
} from "../core/fixtures.js";
import "./fixture.css";

const params = new URLSearchParams(location.search);
type Context = SelectionActionContext<typeof schema, RecordRow>;
function model() {
  let proposal: StateProposal<typeof schema> | null = null;
  const f = fixture(params.has("single") ? "single" : "multiple", {
    ...(params.has("controlled") ? { controlled: ["selection"] as const } : {}),
    onRequest: (next) => {
      proposal = next;
    },
  });
  // Accepted criteria must survive every toolbar swap.
  f.controller.dispatch({
    type: "builder.commit",
    rule: { id: "applied", field: "amount", operator: "number.gt", value: 0 },
  });
  let committed: ControlsInput<typeof schema, RecordRow> | null = null;
  let requestBinding: ControlsRequestBinding<typeof schema> | null = null;
  let snapshotBinding: ControlsRequestBinding<typeof schema> | null = null;
  let serial = 0;
  const begin = () => {
    const request = f.begin("fixture-query", `request-${++serial}`);
    requestBinding = getControlsRequestBinding(
      f.definition,
      f.controller,
      f.resource,
      request,
    );
    return request;
  };
  const succeed = (next: readonly RecordRow[] = records.slice(0, 2)) => {
    f.succeed(next);
    snapshotBinding = requestBinding;
  };
  if (!params.has("initial")) {
    begin();
    succeed();
  }
  return {
    ...f,
    begin,
    succeed,
    bindings: () => ({ request: requestBinding, snapshot: snapshotBinding }),
    commit: (input: ControlsInput<typeof schema, RecordRow>) => {
      committed = input;
    },
    read: () => {
      if (!committed) throw new Error("Not committed");
      return committed;
    },
    accept: () => {
      if (proposal) {
        f.controller.accept(proposal);
        proposal = null;
      }
    },
    reject: () => {
      if (proposal) {
        f.controller.reject(proposal);
        proposal = null;
      }
    },
  };
}

const lifecycle = { mounts: 0, unmounts: 0 };
function Normal({ id }: { readonly id: string }) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const editor = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (open) editor.current?.focus();
  }, [open]);
  useLayoutEffect(() => {
    lifecycle.mounts++;
    return () => {
      lifecycle.unmounts++;
    };
  }, []);
  return (
    <div className="tools" data-testid={`${id}-normal`}>
      {!params.has("no-trigger") ? (
        <Button
          variant="tertiary"
          id={`${id}-trigger`}
          onPress={() => setOpen(true)}
        >
          Filters
        </Button>
      ) : null}
      <span>Amount greater than 0</span>
      <label>
        Embedded search
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <Button variant="tertiary" onPress={() => setOpen(true)}>
        Columns
      </Button>
      {open
        ? createPortal(
            <div
              role="dialog"
              aria-label={`${id} draft editor`}
              className="portal"
            >
              <label>
                Unsubmitted rule
                <input
                  ref={editor}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <Button variant="tertiary" onPress={() => setOpen(false)}>
                Cancel filter edit
              </Button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

interface TestAPI {
  select(ids: string[]): void;
  accept(): void;
  reject(): void;
  refresh(): void;
  fail(): void;
  settle(): void;
  scope(): void;
  access(): void;
  denyRetainingSelection(): void;
  restoreAccess(): void;
  privacyFacts(): {
    blockedReason: string | null;
    selectedIds: readonly string[];
    requestedQuery: unknown;
    acceptedSelection: unknown;
  };
  focusFallbackCalls(): number;
  capture(cancel?: boolean): void;
  invokeSaved(): void;
  replaceAuthority(): void;
  foreignController(): void;
  foreignResource(): void;
  rejectPending(): void;
  setDisabled(value: boolean): void;
  setPending(value: boolean): void;
  setBehavior(value: string): void;
  getCalls(): readonly Context[];
  getErrors(): readonly string[];
  query(): string;
  lifecycle(): typeof lifecycle;
}
declare global {
  interface Window {
    selectionFixture: Record<string, TestAPI>;
  }
}
window.selectionFixture = {};

function TableFixture({ id }: { readonly id: string }) {
  const [owner] = useState(model);
  const server = !params.has("client");
  const view = useSyncExternalStore(
    owner.resource.subscribe,
    owner.resource.getSnapshot,
    owner.resource.getServerSnapshot,
  );
  const [localRecords, setLocalRecords] = useState(records);
  const [authorityVersion, setAuthorityVersion] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [behavior, setBehavior] = useState("success");
  const [calls, setCalls] = useState<Context[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const saved = useRef<(() => void) | null>(null);
  const rejectPending = useRef<((reason: Error) => void) | null>(null);
  const focusFallbackCalls = useRef(0);
  const native = useNativeTable(
    owner.definition,
    owner.controller,
    server
      ? {
          mode: "server",
          records: view.snapshot?.records ?? [],
          pageInfo: view.snapshot?.page ?? {
            kind: "unknown",
            hasNextPage: false,
          },
        }
      : { mode: "client", records: localRecords },
  );
  const input: ControlsInput<typeof schema, RecordRow> = {
    native,
    expected: view.context,
    source: server
      ? {
          mode: "server",
          resource: owner.resource,
          view,
          bindings: owner.bindings(),
        }
      : { mode: "client", context: view.context, records: localRecords },
  };
  const presentation = projectControls(owner.definition, input);
  useLayoutEffect(() => {
    owner.commit(input);
  });
  const events = useMemo(() => {
    void authorityVersion;
    return createControlsAuthority({
      definition: owner.definition,
      controller: owner.controller,
      queryIdentity: native.state.queryIdentity,
      context: view.context,
      readCommitted: owner.read,
      ...(server
        ? { mode: "server" as const, resource: owner.resource }
        : { mode: "client" as const }),
    });
  }, [
    owner,
    native.state.queryIdentity,
    server,
    view.context.definitionKey,
    view.context.scopeKey,
    view.context.access,
    authorityVersion,
  ]);
  const arabic = params.has("rtl");
  const messages: Partial<SelectionToolbarMessages> = arabic
    ? {
        normalLabel: "أدوات الجدول",
        selectionLabel: "تحديد الصفوف",
        actionsLabel: "إجراءات التحديد",
        selectedCount: (count) => `تم تحديد ${count} من العناصر`,
        cancel: "إلغاء التحديد",
        cancelLabel: "إلغاء تحديد جميع الصفوف",
      }
    : params.has("long")
      ? {
          selectedCount: (count) =>
            `${count} records selected across all available pages`,
          cancel: "Cancel the current row selection only",
        }
      : {};
  useLayoutEffect(() => {
    window.selectionFixture[id] = {
      select: (ids) => {
        owner.controller.dispatch({
          type: "selection.change",
          update: Object.fromEntries(ids.map((key) => [key, true])),
        });
      },
      accept: owner.accept,
      reject: owner.reject,
      refresh: () => {
        owner.begin();
      },
      fail: () => {
        const request = owner.resource.getSnapshot().request;
        if (request) owner.resource.fail(request, "offline");
      },
      settle: () => {
        const next = [{ id: "a", amount: 999, eligible: true }];
        if (server) owner.succeed(next);
        else setLocalRecords(next);
      },
      scope: () => {
        owner.controller.dispatch({ type: "selection.cancel" });
        owner.resource.setContext({ ...context, scopeKey: "two" });
        owner.controller.dispatch({
          type: "selection.change",
          update: { "new-scope": true },
        });
      },
      access: () => {
        owner.controller.dispatch({ type: "selection.cancel" });
        owner.resource.setContext({ ...context, access: false });
      },
      denyRetainingSelection: () =>
        owner.resource.setContext({ ...context, access: false }),
      restoreAccess: () => owner.resource.setContext(context),
      privacyFacts: () => ({
        blockedReason: presentation.blockedReason,
        selectedIds: presentation.selectedIds,
        requestedQuery: presentation.requestedQuery,
        acceptedSelection: owner.controller.getSnapshot().selection,
      }),
      focusFallbackCalls: () => focusFallbackCalls.current,
      capture: (cancel = false) => {
        const node = document.querySelectorAll(
          `[data-testid="${id}"] [data-selection-active="true"] button`,
        )[cancel ? 1 : 0];
        if (!node) throw new Error("No action button");
        // Test-only capture of the genuine supplied onPress closure, not a mock
        // Button. This lets a stale async app/DOM callback outlive React's swap.
        const key = Object.keys(node).find((name) =>
          name.startsWith("__reactFiber$"),
        );
        let fiber = key
          ? ((node as unknown as Record<string, unknown>)[key] as {
              memoizedProps?: { onPress?: () => void };
              return?: unknown;
            })
          : undefined;
        while (fiber && !fiber.memoizedProps?.onPress)
          fiber = fiber.return as typeof fiber;
        saved.current = fiber?.memoizedProps?.onPress ?? null;
        if (!saved.current) throw new Error("Missing actual onPress");
      },
      invokeSaved: () => saved.current?.(),
      replaceAuthority: () => setAuthorityVersion((value) => value + 1),
      foreignController: () => {
        const foreign = fixture();
        foreign.begin();
        foreign.succeed();
        owner.commit(foreign.server());
      },
      foreignResource: () => {
        const foreign = fixture();
        foreign.begin();
        foreign.succeed();
        const prior = owner.read();
        const source = foreign.server().source;
        owner.commit({ ...prior, source });
      },
      rejectPending: () =>
        rejectPending.current?.(new Error("Synthetic deferred failure")),
      setDisabled,
      setPending,
      setBehavior,
      getCalls: () => calls,
      getErrors: () => errors,
      query: () => JSON.stringify(owner.controller.getSnapshot().query),
      lifecycle: () => ({ ...lifecycle }),
    };
  });
  return (
    <section aria-label={id} data-testid={id}>
      <div className="external">
        <Button
          variant="tertiary"
          id={`${id}-fallback`}
          onPress={() =>
            owner.controller.dispatch({ type: "selection.cancel" })
          }
        >
          External tab
        </Button>
        <label>
          External date
          <input type="date" defaultValue="2026-11-24" />
        </label>
      </div>
      <SelectionToolbar
        presentation={presentation}
        authority={events}
        normal={<Normal id={id} />}
        messages={messages}
        getRestoreFocusTarget={() => {
          focusFallbackCalls.current++;
          return (
            document.getElementById(`${id}-trigger`) ??
            document.getElementById(`${id}-fallback`)
          );
        }}
        onError={(failure) => {
          setErrors((previous) => [...previous, failure.reason]);
          if (behavior === "report-reject")
            return Promise.reject(new Error("Synthetic reporting failure"));
        }}
        actions={
          params.has("no-actions")
            ? []
            : [
                {
                  id: "review",
                  label: arabic
                    ? "مراجعة العناصر المحددة"
                    : params.has("long")
                      ? "Review the entire selection with application permissions"
                      : "Review selected",
                  isDisabled: disabled,
                  isPending: pending,
                  onAction: (latest) => {
                    setCalls((previous) => [...previous, latest]);
                    if (behavior === "deferred")
                      return new Promise<void>((_resolve, reject) => {
                        rejectPending.current = reject;
                      });
                    if (behavior === "throw")
                      throw new Error("Synthetic callback failure");
                    if (behavior === "reject" || behavior === "report-reject")
                      return Promise.reject(
                        new Error("Synthetic async failure"),
                      );
                  },
                },
              ]
        }
      />
      <table aria-label={`${id} records`}>
        <thead>
          <tr>
            <th>Select</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {native.rows.map((row) => (
            <tr key={row.id}>
              <td>
                <Button
                  variant="tertiary"
                  isDisabled={!row.getCanSelect() || !presentation.canSelect}
                  onPress={() =>
                    events.selectRow(row.id, !native.state.selection[row.id])
                  }
                >
                  Select {row.id}
                </Button>
              </td>
              <td>{row.original.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <span hidden data-testid="Application callback count">
        {calls.length}
      </span>
      <span hidden data-testid="Application failure count">
        {errors.length}
      </span>
      {errors.length ? (
        <p role="alert">The application action could not finish.</p>
      ) : null}
    </section>
  );
}

document.documentElement.dir = params.has("rtl") ? "rtl" : "ltr";
document.documentElement.lang = params.has("rtl") ? "ar" : "en";
document.documentElement.classList.toggle("dark", params.has("dark"));
createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <main>
      <h1>Selected records</h1>
      <TableFixture id="primary" />
      <TableFixture id="independent" />
    </main>
  </StrictMode>,
);
