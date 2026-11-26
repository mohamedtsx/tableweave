import type { NativeTableView, TableController } from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import type {
  DetailsAuthority,
  DetailsOptions,
  DetailsSource,
} from "./.artifacts/declarations/index.js";
import {
  DetailsShell,
  DetailsTrigger,
  useDetailsSession,
} from "./.artifacts/declarations/index.js";

const schema = defineQuerySchema({
  id: "type-details",
  version: 1,
  fields: { name: { type: "text", owner: "none" } },
});
interface Item {
  id: string;
  name: string;
  count: number;
}
declare const controller: TableController<typeof schema>;
declare const view: NativeTableView<typeof schema, Item>;
declare const wrongView: NativeTableView<
  typeof schema,
  { id: string; other: boolean }
>;
declare const authority: DetailsAuthority;
const source: DetailsSource<Item> = {
  authority,
  status: "ready",
  record: { id: "a", name: "Item", count: 0 },
};
const options: DetailsOptions<typeof schema, Item> = {
  controller,
  authority,
  expected: authority.context,
  source,
  port: {
    read: () => ({
      authority,
      nativeFrame: { origin: authority.context, owner: controller, view },
    }),
  },
  visibleFieldIds: ["name"],
  hiddenFieldIds: [],
  focusFallback: () => {},
};
const wrongOptions: DetailsOptions<typeof schema, Item> = {
  ...options,
  port: {
    read: () => ({
      authority,
      nativeFrame: {
        origin: authority.context,
        owner: controller,
        // @ts-expect-error A native view for another record type cannot masquerade as a current row.
        view: wrongView,
      },
    }),
  },
};
void wrongOptions;
const removedUntaggedView: DetailsOptions<typeof schema, Item> = {
  ...options,
  // @ts-expect-error Untagged retained native views are no longer an input.
  currentView: view,
};
void removedUntaggedView;

export function TypedDetails() {
  const session = useDetailsSession(options);
  DetailsTrigger({ session, rowId: "a", label: "Details" });
  return DetailsShell({
    session,
    title: "Details",
    renderBody(context) {
      const count: number | undefined = context.record?.count;
      const rowCount: number | undefined = context.row?.original.count;
      // @ts-expect-error Custom content preserves the application record type.
      const wrong: string = context.record?.count;
      // @ts-expect-error Optional native rows retain genuine native row method typing.
      const fakeRow: typeof context.row = {
        id: "a",
        original: { id: "a", name: "Item", count: 0 },
      };
      void wrong;
      void fakeRow;
      return `${count}:${rowCount}`;
    },
  });
}
// @ts-expect-error A ready detail requires a genuine supplied record.
const missingRecord: DetailsSource<Item> = { authority, status: "ready" };
const badRecord: DetailsSource<Item> = {
  authority,
  status: "ready",
  // @ts-expect-error Wrong record field types are rejected.
  record: { id: "a", name: 1, count: 0 },
};
DetailsShell({
  session: useDetailsSession(options),
  title: "Details",
  // @ts-expect-error Public shell props do not spread arbitrary vendor dismissal state.
  isOpen: true,
  renderBody: () => "Body",
});
void missingRecord;
void badRecord;
