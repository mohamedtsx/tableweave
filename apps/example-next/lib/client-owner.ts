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
  if (app.C.getSnapshot().queryIdentity !== initial.queryIdentity) {
    // This rejected bootstrap has never returned an owner or connected a source.
    // Do not force downstream cleanup if publication disposal reports a blocker.
    const result = app.P.dispose();
    if (result.status !== "disposed")
      throw new Error(
        "Example publication cleanup is blocked; no forced cleanup was performed.",
      );
    app.remote.resource.dispose();
    app.numericOptions.source.dispose();
    app.stringOptions.source.dispose();
    app.C.dispose();
    throw new Error("Initial server/client query identity differs.");
  }
  let mounted: object | null = null;
  let changingConnection = false;
  let connectionFailed = false;
  return {
    app,
    initial,
    connect() {
      if (mounted || changingConnection || connectionFailed)
        throw new Error("Example source owner cannot reconnect.");
      changingConnection = true;
      try {
        const disconnect = app.connect();
        if (!app.getSnapshot().access) {
          // A terminal A owner returns no connection and cannot be resurrected.
          disconnect();
          return () => {};
        }
        const mount = {};
        mounted = mount;
        return () => {
          if (mounted !== mount) return;
          mounted = null;
          changingConnection = true;
          try {
            // Effect release is synchronous, temporary and exact. A later retained
            // effect may reconnect this same C/P; no final-unmount guess is made.
            disconnect();
          } catch (error) {
            connectionFailed = true;
            try {
              app.revoke();
            } catch (revocationError) {
              throw new AggregateError(
                [error, revocationError],
                "Source release and revocation failed.",
              );
            }
            throw error;
          } finally {
            changingConnection = false;
          }
        };
      } catch (error) {
        // No connection receipt was returned. Fail closed through the actual A
        // owner; never invent a disconnect receipt, replacement C/P or new grant.
        connectionFailed = true;
        try {
          app.revoke();
        } catch (revocationError) {
          throw new AggregateError(
            [error, revocationError],
            "Source connection and revocation failed.",
          );
        }
        throw error;
      } finally {
        changingConnection = false;
      }
    },
  };
}
export type ClientOwner = ReturnType<typeof createClientOwner>;
