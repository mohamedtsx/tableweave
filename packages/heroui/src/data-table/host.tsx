"use client";

import {
  type DataTableModel,
  getDataTableModelOwner,
  requireCriteriaSource,
  requireDataTableModel,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  createElement,
  memo,
  type ReactNode,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { ColumnChooser } from "../columns/column-chooser.js";
import {
  CommitMetadata,
  sameCommitOrigin,
} from "../filters/criteria-commit-core.js";
import {
  type CriteriaFacadeSource,
  CriteriaFacadeToolbar,
  createCriteriaFacadeSource,
  getCriteriaFacadeInput,
  publishCriteriaFacadeSource,
} from "../filters/criteria-facade-config.js";
import { FilterBuilder } from "../filters/filter-builder.js";
import type { FilterBuilderProps } from "../filters/types.js";
import { englishDataTableNeutralMessages } from "../localization/data-table.js";
import { Pagination } from "../pagination/Pagination.js";
import { usePaginationCorrection } from "../pagination/usePaginationCorrection.js";
import { SelectionToolbar } from "../selection/selection-toolbar.js";
import { NativeCollection } from "../table/native-collection.js";
import {
  captureTableNavigation,
  getTableReorderingBinding,
  publishTableReordering,
} from "../table/reordering-binding.js";
import { TableReorderingHost } from "../table/reordering-host.js";
import {
  createDataTableRendererCell,
  requireTableRendererSourceTarget,
  requireTableRendererTarget,
  TableRendererCommitError,
  tableRendererStatus,
} from "../table/renderer-commit.js";
import type {
  DataTableNeutralMessages,
  DataTableProps,
  TableRendererCommitted,
  TableRendererLease,
  TableRendererTarget,
} from "../table/types.js";
import { type DetailsBinding, getDetailsBinding } from "./details-binding.js";
import {
  DetailsProvider,
  englishDetailsRegionLabel,
  RecordDetails,
} from "./details-provider.js";
import { DataTableState } from "./state.js";

class Host<S extends QuerySchema, T extends object> {
  readonly owner;
  readonly cell;
  readonly sources;
  readonly signatures;
  private lease: TableRendererLease<S, T> | null = null;
  private domain: Pick<
    NonNullable<DataTableModel<S, T>["metadata"]>,
    "origin" | "mode"
  > | null = null;
  private frameOwner:
    | NonNullable<DataTableModel<S, T>["sourceTarget"]>["owner"]
    | null = null;
  private joined: { binding: DetailsBinding<S, T>; token: object } | null =
    null;
  failed = false;
  private neutralDefaults: Readonly<DataTableNeutralMessages> | null = null;
  private reorderSignature: readonly unknown[] | null = null;
  neutral(explicit: Readonly<DataTableNeutralMessages>) {
    return explicit === englishDataTableNeutralMessages
      ? (this.neutralDefaults ?? explicit)
      : explicit;
  }
  constructor(table: DataTableModel<S, T>) {
    this.owner = getDataTableModelOwner(table) ?? deny();
    this.cell = createDataTableRendererCell(table);
    this.signatures = this.cell.createLocal<readonly unknown[]>("session");
    this.sources = {
      search: createCriteriaFacadeSource(this.cell, "search"),
      builder: createCriteriaFacadeSource(this.cell, "builder"),
      tabs: createCriteriaFacadeSource(this.cell, "tabs"),
      date: createCriteriaFacadeSource(this.cell, "date"),
    };
  }
  allows(table: DataTableModel<S, T>): boolean {
    try {
      const owner = getDataTableModelOwner(table);
      if (
        owner?.definition !== this.owner.definition ||
        owner.controller !== this.owner.controller ||
        this.failed
      )
        return false;
      if (!this.domain) return true;
      const source = table.sourceTarget;
      if (!source || source.owner !== this.frameOwner) return false;
      const metadata = requireCriteriaSource(source.authority, source.owner);
      return (
        metadata.mode === this.domain.mode &&
        sameCommitOrigin(metadata.origin, this.domain.origin)
      );
    } catch {
      return false;
    }
  }
  connect() {
    const lease = this.cell.connect();
    this.lease = lease;
    return lease;
  }
  disconnect(lease: TableRendererLease<S, T>) {
    if (this.lease === lease) {
      const joined = this.joined;
      this.joined = null;
      this.lease = null;
      this.reorderSignature = null;
      try {
        joined?.binding.releaseTable(joined.token);
      } finally {
        this.cell.disconnect(lease);
      }
      return;
    }
    this.cell.disconnect(lease);
  }
  commit(table: DataTableModel<S, T>, input: DataTableProps<S, T>) {
    const lease = this.lease;
    if (!lease) return;
    let reflecting = false;
    try {
      if (!this.allows(table)) deny();
      requireDataTableModel(table, this.owner.definition);
      if (!table.sourceTarget || !table.metadata) {
        if (this.domain) deny();
        return;
      }
      const source = table.sourceTarget,
        metadata = requireCriteriaSource(source.authority, source.owner);
      this.domain ??= Object.freeze({
        origin: metadata.origin,
        mode: metadata.mode,
      });
      this.frameOwner ??= source.owner;
      let actor = this.cell.getSnapshot().actor;
      if (actor) this.cell.updateModel(lease, table);
      reflecting = true;
      const check = () => {
        if (this.lease !== lease || !this.allows(table)) deny();
        requireDataTableModel(table, this.owner.definition);
        return undefined;
      };
      const capture = new CommitMetadata(check, deny),
        signature: unknown[] = [];
      // Fixed reorder refs first. A changed/invalid B is fully authenticated by
      // renderer capture before reflection of private locale/body/formatter refs.
      const reorder = capture.data(input, "reordering", true);
      const reorderSignature: unknown[] = [reorder];
      if (capture.has(input, "reordering")) {
        if (!reorder || typeof reorder !== "object") deny();
        const rows = capture.data(reorder, "rows", true);
        reorderSignature.push(capture.data(reorder, "columns", true), rows);
        if (rows !== undefined) {
          for (const key of [
            "admission",
            "lease",
            "handleColumnId",
            "onSubmit",
          ])
            reorderSignature.push(capture.data(rows, key));
        }
      }
      const reordered =
        !this.reorderSignature ||
        this.reorderSignature.length !== reorderSignature.length ||
        reorderSignature.some(
          (value, index) => value !== this.reorderSignature?.[index],
        );
      let capturedEarly = false;
      if (
        reordered &&
        (reorder !== undefined || this.reorderSignature?.[0] !== undefined)
      ) {
        actor = this.cell.commit(lease, table, input);
        capturedEarly = true;
      }
      // Consumed references/scalars only, under actual metadata proof at layout.
      // No child config internals, callback invocation or candidate spread.
      for (const key of [
        "collection",
        "renderToolbar",
        "renderState",
        "onRetry",
        "actions",
        "getRestoreFocusTarget",
        "onError",
        "formatNumber",
        "columns",
        "messages",
        "locale",
        "tools",
        "layout",
        "accessory",
        "detailsRegionLabel",
        "neutralMessages",
        "paginationCorrection",
        "reordering",
      ]) {
        if (
          this.owner.controller.getDefinition().schema.pagination.enabled ===
            false &&
          (key === "formatNumber" || key === "paginationCorrection")
        )
          continue;
        const value = capture.data(input, key, key !== "collection");
        if (key === "collection" && (!value || typeof value !== "object"))
          deny();
        signature.push(value);
        if (
          [
            "tools",
            "locale",
            "collection",
            "layout",
            "columns",
            "messages",
            "paginationCorrection",
            "reordering",
          ].includes(key) &&
          value !== undefined
        ) {
          const keys =
            key === "tools"
              ? ["search", "builder", "tabs", "date"]
              : key === "locale"
                ? [
                    "locale",
                    "direction",
                    "messages",
                    "builtinOperatorLabels",
                    "neutralMessages",
                    "detailsRegionLabel",
                  ]
                : key === "layout"
                  ? ["id", "className"]
                  : key === "columns"
                    ? [
                        "labels",
                        "isDisabled",
                        "disabledReason",
                        "id",
                        "className",
                        "onResult",
                      ]
                    : key === "messages"
                      ? [
                          "builder",
                          "search",
                          "tabs",
                          "date",
                          "dateEditor",
                          "details",
                          "collection",
                          "sorting",
                          "columnChooser",
                          "selectionToolbar",
                          "pagination",
                          "state",
                          "reordering",
                        ]
                      : key === "reordering"
                        ? ["rows", "columns"]
                        : key === "paginationCorrection"
                          ? ["definition", "context", "epoch", "readCurrent"]
                          : [
                              "label",
                              "rowHeaderColumnId",
                              "selectionColumnId",
                              "rowTextValue",
                              "columnTextValue",
                              "cellTextValue",
                            ];
          for (const nested of keys) {
            const item = capture.data(
              value,
              nested,
              key !== "collection" || nested === "selectionColumnId",
            );
            if (
              key === "collection" &&
              (nested === "label" || nested === "rowHeaderColumnId") &&
              (typeof item !== "string" || !item.trim())
            )
              deny();
            signature.push(item);
          }
        }
      }
      const previous = actor ? this.signatures.read(actor) : null;
      if (
        !actor ||
        !previous ||
        previous.length !== signature.length ||
        signature.some((value, index) => value !== previous[index])
      ) {
        if (!capturedEarly || !actor)
          actor = this.cell.commit(lease, table, input);
        this.signatures.write(actor, Object.freeze(signature));
      }
      this.reorderSignature = Object.freeze(reorderSignature);
      if (!actor) deny();
      check();
      const value = requireTableRendererSourceTarget({
        cell: this.cell,
        actor,
      });
      if (value.ports.neutralMessages) {
        const { uncommitted, unavailable } = value.ports.neutralMessages;
        this.neutralDefaults = Object.freeze({ uncommitted, unavailable });
      } else this.neutralDefaults = null;
      const binding = value.ports.accessory
        ? getDetailsBinding(value.ports.accessory)
        : null;
      if (this.joined?.binding !== binding) {
        this.joined?.binding.releaseTable(this.joined.token);
        this.joined = null;
        if (binding) {
          const token = binding.claimTable(this.cell);
          this.joined = { binding, token };
        }
      }
      if (table.phase === "display")
        publishTableReordering({ cell: this.cell, actor });
      if (table.phase === "display")
        for (const source of Object.values(this.sources))
          publishCriteriaFacadeSource(source, { cell: this.cell, actor });
      check();
    } catch {
      // A same-domain strict-snapshot wait does not authorize config capture.
      if (!reflecting && this.allows(table) && this.domain) {
        try {
          requireDataTableModel(table, this.owner.definition);
        } catch {
          return;
        }
      }
      this.failed = true;
      this.disconnect(lease);
    }
  }
}
function deny(): never {
  throw new TableRendererCommitError();
}
export function DataTableHost<S extends QuerySchema, T extends object>({
  table,
  input,
  neutral,
}: {
  readonly table: DataTableModel<S, T>;
  readonly input: DataTableProps<S, T>;
  readonly neutral: Readonly<DataTableNeutralMessages>;
}) {
  const [host] = useState(() => new Host(table));
  useLayoutEffect(() => {
    const lease = host.connect();
    return () => host.disconnect(lease);
  }, [host]);
  useLayoutEffect(() => {
    host.commit(table, input);
  });
  if (!host.allows(table))
    return <p role="status">{host.neutral(neutral).unavailable}</p>;
  return <Surface host={host} neutral={neutral} />;
}
/** Unsubscribed owner above; only this surface listens to the genuine fixed cell. */
const Surface = memo(
  function Surface<S extends QuerySchema, T extends object>({
    host,
    neutral,
  }: {
    readonly host: Host<S, T>;
    readonly neutral: Readonly<DataTableNeutralMessages>;
  }) {
    const snapshot = useSyncExternalStore(
        host.cell.subscribe,
        host.cell.getSnapshot,
        host.cell.getSnapshot,
      ),
      actor = snapshot.actor;
    if (!actor || host.failed)
      return (
        <p role="status">
          {host.failed
            ? host.neutral(neutral).unavailable
            : host.neutral(neutral).uncommitted}
        </p>
      );
    const target = { cell: host.cell, actor };
    let value: TableRendererCommitted<S, T>;
    try {
      value = requireTableRendererSourceTarget(target);
    } catch {
      return <p role="status">{host.neutral(neutral).unavailable}</p>;
    }
    const { ports } = value,
      status = tableRendererStatus(target),
      accessory = ports.accessory;
    const content = (
      <div
        id={ports.layout?.id}
        className={["tw-data-table", ports.layout?.className]
          .filter(Boolean)
          .join(" ")}
        dir={ports.locale?.direction}
      >
        <div
          className="tw-data-table"
          hidden={status !== "ready"}
          inert={status !== "ready"}
        >
          <CommittedShell host={host} target={target} />
        </div>
        {ports.reordering ? <TableReorderingHost target={target} /> : null}
        <DataTableState target={target} />
        {accessory ? (
          <RecordDetails
            accessory={accessory}
            neutralLabel={ports.detailsRegionLabel ?? englishDetailsRegionLabel}
          />
        ) : null}
      </div>
    );
    return accessory ? (
      <DetailsProvider
        accessory={accessory}
        direction={ports.locale?.direction ?? "ltr"}
      >
        {content}
      </DetailsProvider>
    ) : (
      content
    );
  },
  (a, b) =>
    a.host === b.host &&
    a.neutral.uncommitted === b.neutral.uncommitted &&
    a.neutral.unavailable === b.neutral.unavailable,
) as <S extends QuerySchema, T extends object>(props: {
  readonly host: Host<S, T>;
  readonly neutral: Readonly<DataTableNeutralMessages>;
}) => ReactNode;

function Builder<S extends QuerySchema, T extends object>({
  source,
  host,
}: {
  readonly source: CriteriaFacadeSource<"builder", S, T>;
  readonly host: Host<S, T>;
}) {
  // Both values are from the real parent factory, not an alleged application cell.
  useSyncExternalStore(
    host.cell.subscribe,
    host.cell.getSnapshot,
    host.cell.getSnapshot,
  );
  return createElement(
    FilterBuilder<S>,
    getCriteriaFacadeInput(source) as unknown as FilterBuilderProps<S>,
  );
}
const CommittedShell = memo(
  function CommittedShell<S extends QuerySchema, T extends object>({
    host,
    target,
  }: {
    readonly host: Host<S, T>;
    readonly target: TableRendererTarget<S, T>;
  }) {
    try {
      const value = requireTableRendererTarget(target),
        { model, ports } = value,
        D = host.owner.definition;
      if (
        !model.view ||
        !model.authority ||
        !model.presentation ||
        !model.frame ||
        !ports.collection
      )
        return null;
      const schema = D.native.controllerDefinition.schema,
        owners = Object.values(schema.fields),
        view = model.view,
        authority = model.authority,
        presentation = model.presentation,
        frame = model.frame;
      const tools = (placement: "toolbar" | "external") => (
        <>
          {D.tools.tabs === placement && schema.tabs?.length ? (
            <CriteriaFacadeToolbar source={host.sources.tabs} />
          ) : null}
          {D.tools.date === placement &&
          schema.date &&
          owners.some((f) => f.owner === "date") ? (
            <CriteriaFacadeToolbar source={host.sources.date} />
          ) : null}
          {D.tools.search === placement &&
          owners.some((f) => f.owner === "search") ? (
            <CriteriaFacadeToolbar source={host.sources.search} />
          ) : null}
          {D.tools.builder === placement &&
          owners.some((f) => f.owner === "builder") ? (
            <Builder source={host.sources.builder} host={host} />
          ) : null}
          {D.tools.columnChooser === placement ? (
            <ColumnChooser
              definition={D.native}
              view={view}
              authority={authority}
              presentation={presentation}
              {...ports.columns}
              {...(ports.messages.columnChooser
                ? { messages: ports.messages.columnChooser }
                : {})}
            />
          ) : null}
        </>
      );
      const defaultContent = tools("toolbar");
      const normal =
        model.presentation.selectedIds.length === 0 && ports.renderToolbar
          ? ports.renderToolbar({
              model,
              metadata: value.metadata,
              recovery: model.recovery,
              frame,
              view: model.view,
              presentation: model.presentation,
              defaultContent,
            })
          : defaultContent;
      requireTableRendererTarget(target);
      return (
        <>
          <div className="tw-data-table__external">{tools("external")}</div>
          <div className="tw-data-table__toolbar">
            <SelectionToolbar
              renderer={target}
              normal={normal}
              authority={model.authority}
              presentation={model.presentation}
            />
          </div>
          <div className="tw-data-table__collection">
            <NativeCollection
              renderer={target}
              {...ports.collection}
              view={model.view}
            />
          </div>
          {schema.pagination.enabled !== false ? (
            <div className="tw-data-table__footer">
              <EnabledPager target={target} />
            </div>
          ) : null}
        </>
      );
    } catch (error) {
      if (error instanceof TableRendererCommitError) return null;
      throw error;
    }
  },
  (a, b) =>
    a.host === b.host &&
    a.target.actor === b.target.actor &&
    tableRendererStatus(b.target) === "waiting",
) as <S extends QuerySchema, T extends object>(props: {
  readonly host: Host<S, T>;
  readonly target: TableRendererTarget<S, T>;
}) => ReactNode;

function EnabledPager<S extends QuerySchema, T extends object>({
  target,
}: {
  readonly target: TableRendererTarget<S, T>;
}) {
  const value = requireTableRendererTarget(target),
    { model, ports } = value;
  if (
    !model.definition ||
    !model.controller ||
    !model.presentation ||
    !model.authority ||
    model.definition.native.controllerDefinition.schema.pagination.enabled ===
      false
  )
    return null;
  const binding = getTableReorderingBinding(target);
  const reorderInterlock = binding ? captureTableNavigation(binding) : null;
  return (
    <>
      {ports.paginationCorrection ? (
        <Correction
          target={target}
          {...(reorderInterlock ? { reorderInterlock } : {})}
        />
      ) : null}
      <Pagination
        schema={model.definition.native.controllerDefinition.schema}
        presentation={model.presentation}
        authority={model.authority}
        {...(reorderInterlock ? { reorderInterlock } : {})}
        {...(ports.locale ? { locale: ports.locale.locale } : {})}
        {...(ports.messages.pagination
          ? { messages: ports.messages.pagination }
          : {})}
        {...(ports.formatNumber ? { formatNumber: ports.formatNumber } : {})}
        {...(ports.onRetry
          ? {
              onRetry: () => {
                try {
                  void ports.onRetry?.()?.catch(() => {});
                } catch {
                  /* no transport ownership */
                }
              },
            }
          : {})}
      />
    </>
  );
}
function Correction<S extends QuerySchema, T extends object>({
  target,
  reorderInterlock,
}: {
  readonly target: TableRendererTarget<S, T>;
  readonly reorderInterlock?: import("../table/reordering-types.js").TableReorderingNavigation<
    S,
    T
  >;
}) {
  const { model, ports } = requireTableRendererTarget(target);
  if (
    !model.controller ||
    !model.presentation ||
    !model.authority ||
    !ports.paginationCorrection
  )
    deny();
  usePaginationCorrection(
    model.controller,
    model.presentation,
    model.authority,
    ports.paginationCorrection,
    reorderInterlock,
  );
  return null;
}
