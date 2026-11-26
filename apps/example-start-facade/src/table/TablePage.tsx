import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import type {
  InventoryItem,
  Transaction,
} from "../../../examples/shared/records.js";
import type { BootstrapSession } from "../application/bootstrap-session.js";
import type { Bootstrap, Dataset } from "../application/types.js";
import { HeadlessTable } from "./HeadlessTable.js";
const transactionText = (row: Transaction) => row.description;
const inventoryText = (row: InventoryItem) => row.title;
export function TablePage({
  session,
  receipt,
  recheck,
  away,
}: {
  readonly session: BootstrapSession;
  readonly receipt: Bootstrap;
  readonly recheck: (selected: Dataset) => void;
  readonly away: () => void;
}) {
  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );
  const [hidden, setHidden] = useState(false),
    [attachmentError, setAttachmentError] = useState(false);
  useLayoutEffect(() => {
    try {
      const detach = session.attach(receipt);
      setAttachmentError(false);
      return detach;
    } catch {
      setAttachmentError(true);
      return undefined;
    }
  }, [session, receipt]);
  return (
    <main>
      <h1>Headless Start facade</h1>
      <p>
        Two independent tables of public synthetic inputs. No production
        authentication, persistence or dragging is implemented.
      </p>
      <fieldset>
        <legend>Application source controls</legend>
        <button type="button" onClick={() => recheck("alpha")}>
          Load Alpha synthetic source
        </button>
        <button type="button" onClick={() => recheck("beta")}>
          Load Beta synthetic source
        </button>
        <button type="button" onClick={() => recheck(receipt.dataset)}>
          Recheck synthetic source
        </button>
        <button
          type="button"
          onClick={() => {
            session.retire(
              "Local application source revoked; no backend cancellation promise.",
            );
          }}
        >
          Revoke local source
        </button>
        <button type="button" onClick={() => setHidden((value) => !value)}>
          {hidden ? "Show table UI" : "Hide table UI"}
        </button>
        <button type="button" onClick={away}>
          Leave application route
        </button>
        {state.phase === "retiring" ? (
          <button
            type="button"
            onClick={() => {
              session.retire();
            }}
          >
            Retry source cleanup
          </button>
        ) : null}
      </fieldset>
      <p role="status" aria-label="Application source status">
        {state.notice}
      </p>
      {attachmentError && state.phase !== "retiring" ? (
        <p role="alert">
          No current source attachment. Recheck the synthetic source explicitly.
        </p>
      ) : null}
      {state.receipt ? (
        <p>
          <output aria-label="Synthetic canary">{state.receipt.canary}</output>
        </p>
      ) : null}
      {hidden ? (
        <p>
          Table UI detached. The application source is still owned by this
          router.
        </p>
      ) : state.sources ? (
        <>
          <HeadlessTable
            source={state.sources.transactions}
            title="Synthetic transactions"
            rowHeader="description"
            rowText={transactionText}
          />
          <HeadlessTable
            source={state.sources.inventory}
            title="Synthetic inventory"
            rowHeader="title"
            rowText={inventoryText}
          />
        </>
      ) : (
        <p>No granted table view is mounted yet.</p>
      )}
    </main>
  );
}
