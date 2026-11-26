import { getQueryIdentity, parseQuery } from "@tableweave/react/contracts";
import { minimalTransactionDefinition } from "../../examples/shared/definitions.js";
import { createExampleOwner } from "../../examples/shared/owner.js";
import { fixedNow, receivedAt } from "../../examples/shared/records.js";
import { minimalTransactionSchema } from "../../examples/shared/schemas.js";
import type { InitialPayload } from "./payload.js";

/** Creates actual A D/C/P; never wraps C or manufactures a publication certificate. */
export function createClientOwner(initial: InitialPayload) {
  const parsed = parseQuery(minimalTransactionSchema, initial.query);
  if (
    initial.kind !== "public-synthetic-initial-input" ||
    initial.version !== 1 ||
    initial.locale !== "en-US" ||
    initial.timeZone !== "UTC" ||
    initial.evaluatedAt !== fixedNow ||
    initial.receivedAt !== receivedAt ||
    !parsed.success ||
    getQueryIdentity(minimalTransactionSchema, parsed.data, {
      now: fixedNow,
    }) !== initial.queryIdentity
  )
    throw new Error("Unsupported public example bootstrap.");

  const app = createExampleOwner(minimalTransactionDefinition(), initial.rows, {
    id: `next-transactions:${initial.instance}`,
  });
  let mounted: object | null = null,
    ending: object | null = null,
    disposed = false;
  function dispose() {
    disposed = true;
    const result = app.P.dispose();
    if (result.status !== "disposed")
      throw new Error(
        "Example publication cleanup is blocked; no forced cleanup was performed.",
      );
    app.remote.resource.dispose();
    app.numericOptions.source.dispose();
    app.stringOptions.source.dispose();
    app.C.dispose();
  }
  if (app.C.getSnapshot().queryIdentity !== initial.queryIdentity) {
    dispose();
    throw new Error("Initial server/client query identity differs.");
  }
  return {
    app,
    initial,
    connect() {
      if (disposed || mounted)
        throw new Error("Example source owner cannot reconnect.");
      const mount = {};
      mounted = mount;
      ending = null;
      const disconnect = app.connect();
      return () => {
        if (mounted !== mount) return;
        mounted = null;
        // This is whole source-owner cleanup, NOT optional table visibility.
        // Retire inputs synchronously; allow immediate Strict effect replay to
        // reclaim this same source mount before terminal C/P disposal.
        disconnect();
        const ticket = {};
        ending = ticket;
        queueMicrotask(() => {
          if (ending !== ticket || mounted) return;
          ending = null;
          dispose();
        });
      };
    },
  };
}
export type ClientOwner = ReturnType<typeof createClientOwner>;
