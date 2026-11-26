import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type {
  ControlsInput,
  StateProposal,
} from "../../../packages/react/src/index.js";
import {
  createControlsAuthority,
  createNativeController,
  defineNativeTable,
  projectControls,
} from "../../../packages/react/src/index.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";

export const schema = defineQuerySchema({
  id: "columns-controls",
  version: 1,
  fields: {
    name: { type: "text", owner: "none", sort: true },
    amount: { type: "number", owner: "builder", sort: true },
    fixed: { type: "text", owner: "none" },
    note: { type: "text", owner: "none" },
  },
  sorting: { multi: true },
});
export interface RecordRow {
  id: string;
  name: string;
  amount: number;
  fixed: string;
  note: string;
}
export const records: readonly RecordRow[] = [
  { id: "a", name: "Alpha", amount: 2, fixed: "First", note: "Note A" },
  { id: "b", name: "Beta", amount: 1, fixed: "Second", note: "Note B" },
];
export const context = Object.freeze({
  definitionKey: "columns",
  scopeKey: "one",
  access: true,
});
export function definition(multi = true, required = true) {
  return defineNativeTable<typeof schema, RecordRow>({
    schema,
    multiSort: multi,
    selection: true,
    getRowId: (row) => row.id,
    columns: [
      { id: "utility", header: "Actions", meta: { utility: true } },
      {
        id: "group",
        header: "Data",
        columns: [
          {
            id: "name",
            accessorKey: "name",
            header: "Name",
            meta: { rowHeader: true },
          },
          { id: "amount", accessorKey: "amount", header: "Amount" },
          {
            id: "fixed",
            accessorKey: "fixed",
            header: "Fixed",
            enableHiding: !required,
          },
          { id: "note", accessorKey: "note", header: "Note" },
        ],
      },
    ],
  });
}
export function fixture(
  options: { multi?: boolean; required?: boolean; controlled?: boolean } = {},
) {
  const def = definition(options.multi, options.required);
  let proposal: StateProposal<typeof schema> | null = null;
  let notices = 0;
  const controller = createNativeController(def, {
    initial: {
      query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
    },
    now: () => 0,
    ...(options.controlled
      ? { controlled: ["query", "columns"] as const }
      : {}),
    onRequest: (next) => {
      proposal = next;
    },
  });
  controller.subscribe(() => {
    notices++;
  });
  const boundary = createNativeBoundary(def, controller);
  let committed!: ControlsInput<typeof schema, RecordRow>;
  const render = () => {
    const frame = boundary.prepare(
      { mode: "client", records },
      controller.getSnapshot(),
    );
    boundary.commit(frame);
    const view = boundary.getView(frame);
    committed = {
      native: view,
      expected: context,
      source: { mode: "client", context, records },
    };
    return view;
  };
  const view = render();
  const authority = createControlsAuthority({
    definition: def,
    controller,
    queryIdentity: view.state.queryIdentity,
    mode: "client",
    context,
    readCommitted: () => committed,
  });
  return {
    definition: def,
    controller,
    boundary,
    view,
    authority,
    render,
    presentation: projectControls(def, committed),
    setCommitted: (next: ControlsInput<typeof schema, RecordRow>) => {
      committed = next;
    },
    readCommitted: () => committed,
    notices: () => notices,
    accept: () => {
      if (proposal) controller.accept(proposal);
    },
    reject: () => {
      if (proposal) controller.reject(proposal);
    },
  };
}
