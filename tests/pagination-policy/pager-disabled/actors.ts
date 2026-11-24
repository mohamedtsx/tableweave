import type {
  PaginationCorrectionContext,
  PaginationProps,
} from "../../../packages/heroui/src/pagination/types.js";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { StateProposal } from "../../../packages/react/src/controller/types.js";
import type {
  ControlsInput,
  ControlsPresentation,
} from "../../../packages/react/src/index.js";
import {
  createControlsAuthority,
  createNativeController,
  defineNativeTable,
  projectControls,
} from "../../../packages/react/src/index.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";

export interface Item {
  id: string;
  amount: number;
}
export function schemaFor(enabled: boolean) {
  return defineQuerySchema({
    id: "pager-disabled-source",
    version: 1,
    fields: { amount: { type: "number", owner: "builder", sort: true } },
    pagination: {
      ...(enabled ? {} : { enabled: false }),
      defaultSize: 2,
      sizes: [2, 10],
    },
  });
}
export type Schema = ReturnType<typeof schemaFor>;
export type Facts = ControlsPresentation<Schema, Item>;
export const resourceContext = Object.freeze({
  definitionKey: "synthetic-pager",
  scopeKey: "synthetic-scope",
  access: true,
});

/** Actual registered definition/controller/native views/authority; no allowing doubles. */
export function actor(
  enabled: boolean,
  pageIndex = 4,
  controlled = false,
  count = 3,
) {
  const schema = schemaFor(enabled);
  const definition = defineNativeTable<Schema, Item>({
    schema,
    getRowId: (row) => row.id,
    columns: [{ id: "amount", accessorKey: "amount" }],
  });
  const commands: string[] = [],
    commits: string[] = [],
    proposals: StateProposal<Schema>[] = [];
  const controller = createNativeController(definition, {
    initial: {
      query: createQuery(schema, {
        locale: "en-US",
        timeZone: "UTC",
        pagination: { pageIndex: enabled ? pageIndex : 0, pageSize: 2 },
      }),
    },
    ...(controlled ? { controlled: ["query"] as const } : {}),
    now: () => 0,
    validateCommand: (command) => {
      commands.push(command.type);
    },
    onCommit: (transition) => {
      commits.push(transition.reason);
    },
    onRequest: (proposal) => {
      proposals.push(proposal);
    },
  });
  const makeRecords = (size: number): Item[] =>
    Array.from({ length: size }, (_, amount) => ({ id: `r${amount}`, amount }));
  let records = makeRecords(count);
  const boundary = createNativeBoundary(definition, controller);
  let committed: ControlsInput<Schema, Item>;
  function facts() {
    const frame = boundary.prepare(
      { mode: "client", records },
      controller.getSnapshot(),
    );
    boundary.commit(frame);
    committed = {
      native: boundary.getView(frame),
      expected: resourceContext,
      source: { mode: "client", context: resourceContext, records },
      manualOrder: true,
    };
    return projectControls(definition, committed);
  }
  const authorize = () =>
    createControlsAuthority({
      definition,
      controller,
      queryIdentity: controller.getSnapshot().queryIdentity,
      context: resourceContext,
      mode: "client",
      readCommitted: () => committed,
    });
  const authority = authorize();
  const reads = { count: 0, receiver: [] as boolean[] };
  const context: PaginationCorrectionContext<Schema, Item> = {
    definition,
    context: resourceContext,
    epoch: 0,
    readCurrent() {
      reads.count++;
      reads.receiver.push(this === context);
      return { context: this.context, epoch: this.epoch };
    },
  };
  return {
    schema,
    definition,
    controller,
    facts,
    authority,
    authorize,
    context,
    commands,
    commits,
    proposals,
    reads,
    replaceRecords(size: number) {
      records = makeRecords(size);
    },
  };
}

/** Hostile denial inputs only; never used as an allowing authority/frame. */
export function poison<T>(audit: string[], label: string): T {
  const fail = (operation: string): never => {
    audit.push(`${label}.${operation}`);
    throw new Error(`Synthetic forbidden ${label} ${operation}`);
  };
  return new Proxy(Object.create(null) as object, {
    get: () => fail("get"),
    getOwnPropertyDescriptor: () => fail("descriptor"),
    ownKeys: () => fail("keys"),
    getPrototypeOf: () => fail("prototype"),
  }) as T;
}
export function poisonedProps(
  schema: Schema,
  audit: string[],
): PaginationProps<Schema, Item> {
  return new Proxy(
    { schema },
    {
      get: (target, key) => {
        if (key === "schema") return target.schema;
        audit.push(`props.${String(key)}`);
        throw new Error("Synthetic forbidden pager prop");
      },
    },
  ) as PaginationProps<Schema, Item>;
}
export function withFlag(facts: Facts, descriptor: PropertyDescriptor): Facts {
  // New metadata is deliberately malformed/disabled in denial cases only.
  return Object.defineProperty({ ...facts }, "paginationEnabled", descriptor);
}
