import ClientDataTableBoundary from "../../../../apps/example-next/app/ClientDataTableBoundary.js";
import { buildInitialPayload } from "../../../../apps/example-next/lib/server-contract.js";
/** Injected into an outside-workspace Next fixture only in the final phase.
 * TypeScript's spread is legal; real RSC must reject the function on the wire. */
export default function NonSerializablePage() {
  const wire = {
    initial: buildInitialPayload("primary"),
    onUnexpectedAction: () => undefined,
  };
  return <ClientDataTableBoundary {...wire} />;
}
