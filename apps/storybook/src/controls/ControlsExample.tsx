import {
  ColumnChooser,
  type ColumnControlsTarget,
  NativeCollection,
  Pagination,
  type PaginationCorrectionContext,
  SelectionToolbar,
  Sorting,
  usePaginationCorrection,
} from "@tableweave/heroui";
import {
  type ControlsAuthority,
  type ControlsInput,
  type ControlsPresentation,
  createControlsAuthority,
  getControlsAuthorityOwner,
  type NativeCell,
  type NativeColumn,
  type NativeRow,
  projectControls,
  useNativeTable,
} from "@tableweave/react";
import { canonicalJson, type QueryFor } from "@tableweave/react/contracts";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { I18nProvider } from "react-aria/I18nProvider";
import { createPortal } from "react-dom";
import {
  arabicChooser,
  arabicCollection,
  arabicPagination,
  arabicSelection,
  arabicSorting,
} from "./messages.js";
import {
  type ExampleOptions,
  ExampleOwner,
  type ExampleRecord,
  records,
  schema,
} from "./model.js";
import "@heroui/styles/css";
import "@tableweave/heroui/styles.css";
import "./controls-example.css";

export interface ControlsExampleProps extends Partial<ExampleOptions> {
  readonly dark?: boolean;
  readonly onReady?: (api: ExampleAPI | null) => void;
}
export type RaceKind = "selection" | "visibility" | "query" | "scope";
export interface ExampleAPI {
  readonly owner: ExampleOwner;
  state(): {
    readonly selected: readonly string[];
    readonly query: QueryFor<typeof schema>;
    readonly visibility: Readonly<Record<string, boolean>>;
    readonly epoch: number;
    readonly proposal: string | null;
    readonly transportCount: number;
    readonly resourceKind: string;
    readonly queue: readonly string[];
    readonly normalMounts: number;
    readonly normalUnmounts: number;
    readonly beforeEffectsMasked: boolean;
    readonly commits: readonly string[];
    readonly requests: readonly string[];
  };
  race(
    kind: RaceKind,
    node: HTMLElement,
  ): {
    readonly before: string | null;
    readonly after: string | null;
    readonly connected: boolean;
    readonly acceptedRevision: number;
    readonly afterActionRevision: number;
  };
}

const columnText = (column: NativeColumn<ExampleRecord>) =>
  typeof column.columnDef.header === "string"
    ? column.columnDef.header
    : column.id;
const rowText = (row: NativeRow<ExampleRecord>) => row.original.name;
const cellText = (cell: NativeCell<ExampleRecord>) =>
  String(cell.getValue() ?? "");

/** Own local note draft: intentionally NOT FilterBuilder/Search or a query draft. */
function NormalTools({
  owner,
  target,
  rtl,
}: {
  readonly owner: ExampleOwner;
  readonly target: ColumnControlsTarget<typeof schema, ExampleRecord>;
  readonly rtl: boolean;
}) {
  const [draft, setDraft] = useState(owner.getSnapshot().note);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    owner.audit.normalMounts++;
    return () => {
      owner.audit.normalUnmounts++;
    };
  }, [owner]);
  useLayoutEffect(() => {
    if (open) editor.current?.focus();
  }, [open]);
  const close = () => {
    trigger.current?.focus();
    setOpen(false);
  };
  const discard = () => {
    setDraft(owner.getSnapshot().note);
    close();
  };
  return (
    <div className="ct-tools">
      <Sorting
        {...target}
        id={`${owner.options.id}-sorting`}
        {...(rtl ? { messages: arabicSorting } : {})}
      />
      <ColumnChooser
        {...target}
        id={`${owner.options.id}-columns`}
        {...(rtl ? { messages: arabicChooser } : {})}
      />
      <button
        id={`${owner.options.id}-note-trigger`}
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
      >
        Open scratch note
      </button>
      {open
        ? createPortal(
            <div
              role="dialog"
              aria-label={`${owner.options.id} scratch note`}
              className="ct-note-dialog"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  discard();
                }
              }}
            >
              <h2>Local workspace note</h2>
              <p>This draft is not filter criteria.</p>
              <label>
                Scratch note draft
                <textarea
                  ref={editor}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  owner.setNote(draft);
                  close();
                }}
              >
                Save note
              </button>
              <button type="button" onClick={discard}>
                Discard note
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Surface({
  owner,
  onReady,
}: {
  readonly owner: ExampleOwner;
  readonly onReady: ControlsExampleProps["onReady"];
}) {
  const app = useSyncExternalStore(
    owner.subscribe,
    owner.getSnapshot,
    owner.getSnapshot,
  );
  const resource = useSyncExternalStore(
    owner.resource.subscribe,
    owner.resource.getSnapshot,
    owner.resource.getServerSnapshot,
  );
  const view = useNativeTable(
    owner.definition,
    owner.controller,
    owner.options.mode === "server"
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
  const input: ControlsInput<typeof schema, ExampleRecord> = {
    native: view,
    expected: app.context,
    source:
      owner.options.mode === "server"
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
  const presentation = projectControls(owner.definition, input);
  const authority = useMemo(() => {
    const base = {
      definition: owner.definition,
      controller: owner.controller,
      queryIdentity: view.state.queryIdentity,
      context: app.context,
      readCommitted: owner.readCommitted,
    };
    return owner.options.mode === "server"
      ? createControlsAuthority({
          ...base,
          mode: "server",
          resource: owner.resource,
        })
      : createControlsAuthority({ ...base, mode: "client" });
  }, [owner, view.state.queryIdentity, app.context]);
  const proof = getControlsAuthorityOwner(authority);
  const owns =
    proof?.definition === owner.definition &&
    proof.controller === view.controller;
  const available = presentation.requestedQuery !== null;
  const rtl = owner.options.locale === "ar-EG";
  const root = useRef<HTMLElement>(null);
  const commits = useRef(0);
  const beforeEffectsMasked = useRef(false);

  // The explicit app expected context may change before the adapter effect. The
  // SAME input already masks every private control on that first committed frame.
  useLayoutEffect(() => {
    commits.current++;
    root.current?.setAttribute("data-frame", String(commits.current));
    if (
      app.context.scopeKey !== resource.context.scopeKey ||
      app.context.access !== resource.context.access
    ) {
      beforeEffectsMasked.current =
        !available &&
        root.current?.querySelector(
          ".ct-private button,.ct-private input,.ct-private [role=grid]",
        ) === null;
    }
  });
  useEffect(() => owner.connect(), [owner]);
  useEffect(() => owner.syncContext(app.context), [owner, app.context]);

  // This is a real own-data synchronous METHOD. The hook must preserve its
  // receiver; a detached callback would fail at this.owner. No Promise contract.
  const correctionPort = useMemo(
    () => ({
      definition: owner.definition,
      context: app.context,
      epoch: app.acceptedEpoch,
      owner,
      readCurrent() {
        const current = this.owner.getSnapshot();
        return { context: current.context, epoch: current.epoch };
      },
    }),
    [owner, app.context, app.acceptedEpoch],
  );

  useLayoutEffect(() => {
    const api: ExampleAPI = {
      owner,
      state: () => ({
        selected: Object.keys(owner.controller.getSnapshot().selection),
        query: owner.controller.getSnapshot().query,
        visibility: owner.controller.getSnapshot().columns.visibility,
        epoch: owner.getSnapshot().epoch,
        proposal: owner.getSnapshot().proposal?.transition.reason ?? null,
        transportCount: owner.getSnapshot().transportCount,
        resourceKind: owner.resource.getSnapshot().kind,
        queue: owner.getSnapshot().queue,
        normalMounts: owner.audit.normalMounts,
        normalUnmounts: owner.audit.normalUnmounts,
        beforeEffectsMasked: beforeEffectsMasked.current,
        commits: owner.audit.commits,
        requests: owner.audit.requests,
      }),
      race(kind, node) {
        const before = root.current?.getAttribute("data-frame") ?? null;
        if (kind === "selection")
          owner.external({
            type: "selection.change",
            update: { fresh: true, off: true },
          });
        if (kind === "visibility")
          owner.external({
            type: "columns.visibility",
            update: { name: false },
          });
        if (kind === "query")
          owner.external(
            {
              type: "pagination.change",
              update: { pageIndex: 1, pageSize: 3 },
            },
            true,
          );
        if (kind === "scope")
          owner.setExpected(
            { ...owner.getSnapshot().context, scopeKey: "B", access: false },
            true,
          );
        const after = root.current?.getAttribute("data-frame") ?? null;
        const connected = node.isConnected;
        const acceptedRevision = owner.controller.getSnapshot().revision;
        node.click();
        return {
          before,
          after,
          connected,
          acceptedRevision,
          afterActionRevision: owner.controller.getSnapshot().revision,
        };
      },
    };
    onReady?.(api);
    return () => onReady?.(null);
  });

  const target = {
    definition: owner.definition,
    view,
    presentation,
    authority,
  };
  return (
    <section
      ref={root}
      id={owner.options.id}
      className="ct-example"
      data-owner-match={String(owns)}
    >
      <h2>
        {owner.options.id} ·{" "}
        {owner.options.single ? "Single selection" : "Multiple selection"}
      </h2>
      <p>
        Application-owned synthetic records. UI guards are not backend
        authorization.
      </p>
      <ScenarioControls
        owner={owner}
        kind={resource.kind}
        count={app.transportCount}
      />
      <section
        className="ct-private"
        aria-label={`${owner.options.id} private controls`}
      >
        <SelectionToolbar
          presentation={presentation}
          authority={authority}
          normal={<NormalTools owner={owner} target={target} rtl={rtl} />}
          actions={[
            {
              id: "review",
              label: "Queue review",
              onAction: (current) =>
                owner.enqueue({
                  ids: current.selectedIds,
                  loaded: current.loadedSelected.map((item) => item.id),
                  missing: current.missingSelectedIds,
                }),
            },
          ]}
          getRestoreFocusTarget={() =>
            document.getElementById(`${owner.options.id}-note-trigger`)
          }
          onError={() => owner.reportFailure()}
          {...(rtl ? { messages: arabicSelection } : {})}
        />
        <NativeCollection
          view={view}
          label={`${owner.options.id} records`}
          rowHeaderColumnId="name"
          selectionColumnId="selection"
          columnTextValue={columnText}
          rowTextValue={rowText}
          cellTextValue={cellText}
          controls={{ definition: owner.definition, presentation, authority }}
          diagnostics={false}
          {...(rtl ? { messages: arabicCollection } : {})}
        />
        {available ? (
          <>
            <Pagination
              schema={schema}
              presentation={presentation}
              authority={authority}
              id={`${owner.options.id}-pager`}
              onRetry={() => {
                authority.retry();
              }}
              {...(rtl ? { messages: arabicPagination } : {})}
            />
            <p data-testid="criteria">
              Applied criteria: {canonicalJson(view.state.query.builder)}
            </p>
            <p>
              Saved workspace note: <bdi>{app.note || "None"}</bdi>
            </p>
            <output aria-label="Review queue">
              {app.queue.length} IDs in the local review queue
            </output>
            <p role="status" aria-label="Action feedback">
              {app.feedback}
            </p>
          </>
        ) : (
          <p role="status">This context is unavailable.</p>
        )}
      </section>
      {owner.options.correction ? (
        <Correction
          owner={owner}
          presentation={presentation}
          authority={authority}
          port={correctionPort}
        />
      ) : null}
    </section>
  );
}

function Correction({
  owner,
  presentation,
  authority,
  port,
}: {
  readonly owner: ExampleOwner;
  readonly presentation: ControlsPresentation<typeof schema, ExampleRecord>;
  readonly authority: ControlsAuthority<typeof schema, ExampleRecord>;
  readonly port: PaginationCorrectionContext<typeof schema, ExampleRecord>;
}) {
  usePaginationCorrection(owner.controller, presentation, authority, port);
  return null;
}

export function ControlsExample(props: ControlsExampleProps) {
  const [owner] = useState(
    () =>
      new ExampleOwner({
        id: props.id ?? "orders",
        mode: props.mode ?? "server",
        single: props.single ?? false,
        controlled: props.controlled ?? false,
        locale: props.locale ?? "en-US",
        initialPage: props.initialPage ?? 0,
        correction: props.correction ?? false,
      }),
  );
  const rtl = owner.options.locale === "ar-EG";
  return (
    <I18nProvider locale={owner.options.locale}>
      <div
        className={`ct-host ${props.dark ? "dark" : "light"}`}
        data-theme={props.dark ? "dark" : "light"}
        dir={rtl ? "rtl" : "ltr"}
        lang={rtl ? "ar" : "en"}
      >
        <Surface owner={owner} onReady={props.onReady} />
      </div>
    </I18nProvider>
  );
}

function ScenarioControls({
  owner,
  kind,
  count,
}: {
  readonly owner: ExampleOwner;
  readonly kind: string;
  readonly count: number;
}) {
  const actions: readonly (readonly [string, () => void])[] = [
    ["Begin request", () => owner.begin()],
    ["Settle known", () => owner.settle()],
    ["Settle unknown", () => owner.settle(owner.getSnapshot().total, true)],
    ["Settle zero", () => owner.settle(0)],
    ["Fail request", () => owner.fail()],
    [
      "Select loaded and missing IDs",
      () =>
        owner.external({
          type: "selection.change",
          update: owner.options.single ? { a: true } : { a: true, off: true },
        }),
    ],
    ["Accept proposal", () => owner.accept()],
    ["Reject proposal", () => owner.reject()],
    [
      "Change scope",
      () => {
        const context = owner.getSnapshot().context;
        owner.setExpected(
          { ...context, scopeKey: context.scopeKey === "A" ? "B" : "A" },
          true,
        );
      },
    ],
    [
      "Mask before effects",
      () =>
        owner.setExpected({ ...owner.getSnapshot().context, access: false }),
    ],
    [
      "Restore access",
      () =>
        owner.setExpected(
          { ...owner.getSnapshot().context, access: true },
          true,
        ),
    ],
    ["Toggle action failure", () => owner.setFailAction()],
    [
      "Shrink to seven",
      () => {
        owner.begin();
        owner.settle(7);
      },
    ],
    ["Respond with one", () => owner.settle(1)],
    [
      "Set two sort priorities",
      () =>
        owner.external(
          {
            type: "sorting.change",
            update: [
              { id: "name", desc: false },
              { id: "score", desc: true },
            ],
          },
          true,
        ),
    ],
  ];
  return (
    <details className="ct-scenarios" open>
      <summary>Scenario controls</summary>
      <p role="status" aria-label="Transport state">
        {kind} · {count} application transport starts
      </p>
      <div className="ct-tools">
        {actions.map(([name, action]) => (
          <button key={name} type="button" onClick={action}>
            {name}
          </button>
        ))}
      </div>
    </details>
  );
}
