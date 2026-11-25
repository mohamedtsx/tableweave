import { Button } from "@heroui/react/button";
import type {
  DetailsAccessoryOptions,
  DetailsAuthority,
  DetailsPort,
  DetailsRenderContext,
  DetailsSource,
} from "@tableweave/heroui";
import type { QuerySchema } from "@tableweave/react/contracts";
import { useEffect, useSyncExternalStore } from "react";
import type { ExampleOwner } from "./owner.js";
import type { Customer, InventoryItem, Transaction } from "./records.js";
import type {
  CustomerSchema,
  InventorySchema,
  TransactionSchema,
} from "./schemas.js";

/** Application detail source, separate from current-page native records. */
export function createExampleDetails<S extends QuerySchema, T extends object>(
  owner: ExampleOwner<S, T>,
) {
  let authority: DetailsAuthority = {
    context: {
      ...owner.context,
      datasetKey: owner.context.definitionKey,
      epoch: 0,
    },
    rowId: null,
    session: 0,
    generation: 0,
  };
  let source: DetailsSource<T> | null = null,
    dirty = false,
    confirm: ((answer: boolean) => void) | null = null;
  let pending: DetailsAuthority | null = null;
  let decision: object | null = null;
  let drafts: Readonly<Record<string, string>> = Object.freeze({});
  const issued = new WeakSet<DetailsAuthority>([authority]);
  let snapshot: Readonly<{
    authority: DetailsAuthority;
    source: DetailsSource<T> | null;
    dirty: boolean;
    confirming: boolean;
    drafts: Readonly<Record<string, string>>;
    decision: object | null;
  }> = Object.freeze({
    authority,
    source,
    dirty,
    confirming: false,
    drafts,
    decision,
  });
  const listeners = new Set<() => void>();
  function publish() {
    issued.add(authority);
    snapshot = Object.freeze({
      authority,
      source,
      dirty,
      drafts,
      decision,
      confirming: confirm !== null,
    });
    for (const listener of listeners) listener();
  }
  function sync() {
    if (!owner.getSnapshot().access || !authority.context.access) return;
    const rowId = owner.C.getSnapshot().details.rowId;
    if (rowId !== authority.rowId) {
      const abandoned = confirm;
      confirm = null;
      decision = null;
      authority = {
        ...authority,
        rowId,
        session: authority.session + 1,
        generation: authority.generation + 1,
      };
      dirty = false;
      drafts = Object.freeze({});
      pending = null;
      const record = rowId ? owner.record(rowId) : undefined;
      source = !rowId
        ? null
        : record
          ? { authority, status: "ready", record }
          : { authority, status: "missing" };
      publish();
      abandoned?.(false);
    } else if (rowId && source?.status === "ready") {
      const record = owner.record(rowId);
      if (record !== source.record) {
        authority = { ...authority, generation: authority.generation + 1 };
        source = record
          ? { authority, status: "ready", record }
          : { authority, status: "missing" };
        publish();
      }
    }
  }
  function retire(): undefined {
    const resolve = confirm;
    confirm = null;
    decision = null;
    dirty = false;
    drafts = Object.freeze({});
    pending = null;
    source = null;
    authority = {
      ...authority,
      rowId: null,
      session: authority.session + 1,
      generation: authority.generation + 1,
      context: {
        ...authority.context,
        access: false,
        epoch: authority.context.epoch + 1,
      },
    };
    publish();
    resolve?.(false);
    return undefined;
  }
  function isCurrent(expected: DetailsAuthority) {
    return (
      issued.has(expected) &&
      owner.getSnapshot().access &&
      authority.context.access &&
      expected.context.access &&
      expected.rowId === authority.rowId &&
      expected.session === authority.session &&
      expected.context.epoch === authority.context.epoch &&
      expected.context.scopeKey === authority.context.scopeKey &&
      expected.context.definitionKey === authority.context.definitionKey &&
      expected.context.datasetKey === authority.context.datasetKey
    );
  }
  function load(expected: DetailsAuthority) {
    if (
      !isCurrent(expected) ||
      expected.generation !== authority.generation ||
      !authority.rowId ||
      !authority.context.access ||
      !owner.getSnapshot().access
    )
      return;
    authority = { ...authority, generation: authority.generation + 1 };
    pending = authority;
    source = { authority, status: "loading" };
    publish();
  }
  const port: DetailsPort<S, T> = {
    read() {
      return { authority };
    },
    retry(current) {
      if (
        current.rowId === authority.rowId &&
        current.session === authority.session &&
        current.generation === authority.generation &&
        current.context.epoch === authority.context.epoch &&
        current.context.scopeKey === authority.context.scopeKey &&
        current.context.access &&
        authority.context.access
      )
        load(authority);
    },
  };
  const beforeChange: NonNullable<
    DetailsAccessoryOptions<S, T>["beforeChange"]
  > = () => {
    if (!dirty) return true;
    return new Promise<boolean>((resolve) => {
      const abandoned = confirm;
      decision = Object.freeze({});
      confirm = resolve;
      publish();
      abandoned?.(false);
    });
  };
  return {
    port,
    beforeChange,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect() {
      // Real public P participant clears detail data/policies before P observers.
      const unregister = owner.P.registerParticipant(owner.criteria(), {
        purge: retire,
      });
      const stopC = owner.C.subscribe(sync),
        stopSource = owner.subscribe(sync);
      // Strict reconnect is an explicit detail-owner mount, not access restoration.
      if (owner.getSnapshot().access && !authority.context.access) {
        authority = {
          ...authority,
          context: { ...authority.context, access: true },
        };
        publish();
      }
      sync();
      return () => {
        stopC();
        stopSource();
        unregister();
        retire();
      };
    },
    load,
    isCurrent,
    editDraft(expected: DetailsAuthority, key: string, value: string) {
      if (!isCurrent(expected)) return;
      drafts = Object.freeze({ ...drafts, [key]: value });
      dirty = true;
      publish();
    },
    respond(expected: DetailsAuthority, kind: "ready" | "missing" | "error") {
      const ticket = pending;
      if (
        !ticket ||
        expected !== ticket ||
        ticket !== authority ||
        !authority.context.access ||
        !owner.getSnapshot().access
      )
        return;
      pending = null;
      const record = ticket.rowId ? owner.record(ticket.rowId) : undefined;
      source =
        kind === "error"
          ? { authority, status: "error", code: "unavailable" }
          : kind === "missing" || !record
            ? { authority, status: "missing" }
            : { authority, status: "ready", record };
      publish();
    },
    setDirty(expected: DetailsAuthority, value: boolean) {
      if (!isCurrent(expected)) return;
      dirty = value;
      publish();
    },
    answer(
      expected: DetailsAuthority,
      ticket: object | null,
      discard: boolean,
    ) {
      if (!ticket || ticket !== decision || !isCurrent(expected)) return;
      const resolve = confirm;
      confirm = null;
      decision = null;
      if (discard) dirty = false;
      publish();
      resolve?.(discard);
    },
  };
}
export type ExampleDetails<
  S extends QuerySchema,
  T extends object,
> = ReturnType<typeof createExampleDetails<S, T>>;
export function useExampleDetailSource<S extends QuerySchema, T extends object>(
  driver: ExampleDetails<S, T>,
) {
  const snapshot = useSyncExternalStore(
    driver.subscribe,
    driver.getSnapshot,
    driver.getSnapshot,
  );
  useEffect(() => driver.connect(), [driver]);
  return snapshot;
}
function DirtyDecision<S extends QuerySchema, T extends object>({
  driver,
}: {
  driver: ExampleDetails<S, T>;
}) {
  const state = useSyncExternalStore(
    driver.subscribe,
    driver.getSnapshot,
    driver.getSnapshot,
  );
  return state.confirming ? (
    <fieldset className="space-y-2 border-t border-border pt-3">
      <legend>Unsaved draft decision</legend>
      <p>Discard the unsaved local draft?</p>
      <Button
        variant="secondary"
        onPress={() => driver.answer(state.authority, state.decision, true)}
      >
        Discard draft
      </Button>
      <Button
        variant="tertiary"
        onPress={() => driver.answer(state.authority, state.decision, false)}
      >
        Keep editing
      </Button>
    </fieldset>
  ) : null;
}
function DetailTransport<S extends QuerySchema, T extends object>({
  driver,
}: {
  driver: ExampleDetails<S, T>;
}) {
  const state = useSyncExternalStore(
    driver.subscribe,
    driver.getSnapshot,
    driver.getSnapshot,
  );
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend>Synthetic detail transport</legend>
      <Button variant="tertiary" onPress={() => driver.load(state.authority)}>
        Refresh detail
      </Button>
      {state.source?.status === "loading" ? (
        <>
          <Button
            variant="secondary"
            onPress={() => driver.respond(state.authority, "ready")}
          >
            Deliver detail
          </Button>
          <Button
            variant="tertiary"
            onPress={() => driver.respond(state.authority, "error")}
          >
            Fail detail
          </Button>
          <Button
            variant="tertiary"
            onPress={() => driver.respond(state.authority, "missing")}
          >
            Report missing detail
          </Button>
        </>
      ) : null}
    </fieldset>
  );
}
const fieldClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground";
export function TransactionDetails({
  context,
  owner,
  driver,
}: {
  context: DetailsRenderContext<TransactionSchema, Transaction>;
  owner: ExampleOwner<TransactionSchema, Transaction>;
  driver: ExampleDetails<TransactionSchema, Transaction>;
}) {
  const state = useSyncExternalStore(
      driver.subscribe,
      driver.getSnapshot,
      driver.getSnapshot,
    ),
    origin = state.authority;
  if (context.recordId !== origin.rowId || !driver.isCurrent(origin))
    return <p>Record details are unavailable.</p>;
  const reference = state.drafts.reference ?? context.record?.reference ?? "";
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!driver.isCurrent(origin)) return;
        owner.updateRecord(context.recordId, (record) => ({
          ...record,
          reference,
        }));
        driver.setDirty(origin, false);
      }}
    >
      <p>
        Application-owned reconciliation note. No payment operation is
        performed.
      </p>
      <label className="block">
        Reference draft
        <input
          className={fieldClass}
          value={reference}
          onChange={(event) => {
            driver.editDraft(origin, "reference", event.target.value);
          }}
        />
      </label>
      <Button
        type="submit"
        variant="secondary"
        isDisabled={context.status !== "ready"}
      >
        Save synthetic reference
      </Button>
      <DetailTransport driver={driver} />
      <DirtyDecision driver={driver} />
    </form>
  );
}
export function CustomerDetails({
  context,
  owner,
  driver,
}: {
  context: DetailsRenderContext<CustomerSchema, Customer>;
  owner: ExampleOwner<CustomerSchema, Customer>;
  driver: ExampleDetails<CustomerSchema, Customer>;
}) {
  const state = useSyncExternalStore(
      driver.subscribe,
      driver.getSnapshot,
      driver.getSnapshot,
    ),
    origin = state.authority;
  if (context.recordId !== origin.rowId || !driver.isCurrent(origin))
    return <p>Record details are unavailable.</p>;
  const note = state.drafts.note ?? context.record?.note ?? "",
    delivery = state.drafts.delivery ?? "summary";
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!driver.isCurrent(origin)) return;
        owner.updateRecord(context.recordId, (record) => ({ ...record, note }));
        driver.setDirty(origin, false);
      }}
    >
      <h3 className="font-semibold">Account workspace</h3>
      <p>
        Customer teams and application notes are not a generated property list.
      </p>
      <label className="block">
        Working note
        <textarea
          className={fieldClass}
          value={note}
          onChange={(event) => {
            driver.editDraft(origin, "note", event.target.value);
          }}
        />
      </label>
      <label className="block">
        Local report view
        <select
          className={fieldClass}
          value={delivery}
          onChange={(event) => {
            driver.editDraft(origin, "delivery", event.target.value);
          }}
        >
          <option value="summary">Summary</option>
          <option value="teams">Team breakdown</option>
        </select>
      </label>
      <Button
        type="submit"
        variant="secondary"
        isDisabled={context.status !== "ready"}
      >
        Save synthetic note
      </Button>
      <DetailTransport driver={driver} />
      <DirtyDecision driver={driver} />
    </form>
  );
}
export function InventoryDetails({
  context,
  owner,
  driver,
}: {
  context: DetailsRenderContext<InventorySchema, InventoryItem>;
  owner: ExampleOwner<InventorySchema, InventoryItem>;
  driver: ExampleDetails<InventorySchema, InventoryItem>;
}) {
  const state = useSyncExternalStore(
      driver.subscribe,
      driver.getSnapshot,
      driver.getSnapshot,
    ),
    origin = state.authority;
  if (context.recordId !== origin.rowId || !driver.isCurrent(origin))
    return <p>Record details are unavailable.</p>;
  const quantity =
      state.drafts.quantity ?? String(context.record?.quantity ?? 0),
    note = state.drafts.note ?? context.record?.note ?? "";
  const valid =
    /^\d+$/.test(quantity) && Number.isSafeInteger(Number(quantity));
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid || !driver.isCurrent(origin)) return;
        owner.updateRecord(context.recordId, (record) => ({
          ...record,
          quantity: Number(quantity),
          note,
        }));
        driver.setDirty(origin, false);
      }}
    >
      <h3 className="font-semibold">Stock worksheet</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          Count draft
          <input
            className={fieldClass}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => {
              driver.editDraft(origin, "quantity", event.target.value);
            }}
          />
        </label>
        <label>
          Location note
          <input
            className={fieldClass}
            value={note}
            onChange={(event) => {
              driver.editDraft(origin, "note", event.target.value);
            }}
          />
        </label>
      </div>
      {!valid ? <p role="alert">Enter a non-negative whole count.</p> : null}
      <Button
        type="submit"
        variant="secondary"
        isDisabled={!valid || context.status !== "ready"}
      >
        Apply synthetic count
      </Button>
      <DetailTransport driver={driver} />
      <DirtyDecision driver={driver} />
    </form>
  );
}
