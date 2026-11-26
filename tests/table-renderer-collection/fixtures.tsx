import {
  beginControlsRequest,
  createResourceAdapter,
  type DataTableOptions,
  defineTable,
  getControlsRequestBinding,
  type NativeCell,
} from "@tableweave/react";
import {
  createQuery,
  defineQuerySchema,
  type QueryFor,
} from "@tableweave/react/contracts";
import { Component, forwardRef, memo, type ReactNode, useState } from "react";
import { ApplicationOwner } from "../table-facade/hook/owner.js";

export interface Item {
  id: string;
  amount: number;
  title: string;
}
export const schema = defineQuerySchema({
  id: "renderer-collection",
  version: 1,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    title: { type: "text", owner: "search", sort: true },
  },
  pagination: { enabled: true, defaultSize: 25, sizes: [25] },
});
export type S = typeof schema;
export type CellContext = ReturnType<NativeCell<Item>["getContext"]>;
export type Shape =
  | "function"
  | "hook"
  | "memo"
  | "forwardRef"
  | "class"
  | "suspense";
export function fixture(shape: Shape = "hook", sourceOnly = false) {
  const counts = {
    body: 0,
    rowId: 0,
    rowText: 0,
    columnText: 0,
    cellText: 0,
    actionA: 0,
    actionB: 0,
    errorA: 0,
    errorB: 0,
    focusA: 0,
    focusB: 0,
  };
  const never = new Promise<void>(() => {});
  function FunctionCell(props: CellContext) {
    counts.body++;
    return <span data-native-body>{props.row.original.title}</span>;
  }
  function HookCell(props: CellContext) {
    counts.body++;
    const [initial] = useState(props.row.original.title);
    return (
      <input aria-label={`Native ${props.row.id}`} defaultValue={initial} />
    );
  }
  const MemoCell = memo(HookCell);
  const RefCell = forwardRef<HTMLInputElement, CellContext>((props, ref) => {
    counts.body++;
    return (
      <input
        ref={ref}
        aria-label={`Native ${props.row.id}`}
        defaultValue={props.row.original.title}
      />
    );
  });
  class ClassCell extends Component<CellContext> {
    override render() {
      counts.body++;
      return (
        <input
          aria-label={`Native ${this.props.row.id}`}
          defaultValue={this.props.row.original.title}
        />
      );
    }
  }
  function Suspended(_props: CellContext): never {
    counts.body++;
    throw never;
  }
  const renderers = {
    function: FunctionCell,
    hook: HookCell,
    memo: MemoCell,
    forwardRef: RefCell,
    class: ClassCell,
    suspense: Suspended,
  };
  // Runtime-shape fixture ONLY: upstream ColumnDefTemplate types omit construct-
  // only class types although its actual FlexRender/Renderable API accepts them.
  // No production callback/S/T widening and never a hand call of this value.
  const renderer = renderers[shape] as unknown as (
    props: CellContext,
  ) => ReactNode;
  const D = defineTable<Item>()({
    schema,
    selection: "multiple",
    getRowId(row) {
      counts.rowId++;
      return row.id;
    },
    columns: [
      { id: "amount", accessorKey: "amount", header: "Amount" },
      { id: "title", accessorKey: "title", header: "Title", cell: renderer },
    ],
  });
  const context = {
    definitionKey: "renderer-collection",
    scopeKey: "synthetic",
    access: true,
  };
  const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
  const app = new ApplicationOwner(D, context, { query }, () =>
    Date.parse("2026-01-15T12:00:00Z"),
  );
  app.prepare();
  app.settle();
  let data: readonly Item[] = [
    { id: "r1", amount: 1, title: "Synthetic one" },
    { id: "r2", amount: 2, title: "Synthetic two" },
  ];
  const resource = createResourceAdapter<Item, QueryFor<S>>(context);
  const request = sourceOnly
    ? beginControlsRequest(D.native, app.C, resource, {
        ...context,
        queryKey: app.C.getSnapshot().queryIdentity,
        requestKey: "synthetic-initial",
        retry: () => {},
        extent: { kind: "page", ...query.pagination },
      })
    : null;
  if (request) resource.fail(request.request, "offline");
  function options(): DataTableOptions<S, Item> {
    const base = {
      controller: app.C,
      publication: app.P,
      criteria: app.criteria(),
      expected: context,
    };
    if (sourceOnly)
      return {
        ...base,
        source: {
          mode: "server",
          resource,
          view: resource.getSnapshot(),
          bindings: {
            request: request
              ? getControlsRequestBinding(
                  D.native,
                  app.C,
                  resource,
                  request.request,
                )
              : null,
            snapshot: null,
          },
        },
      };
    return { ...base, source: { mode: "client", context, records: data } };
  }
  return {
    D,
    app,
    context,
    counts,
    options,
    replace() {
      data = data.map((row) => ({ ...row }));
    },
  };
}
