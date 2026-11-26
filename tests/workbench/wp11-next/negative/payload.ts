import type { InitialPayload } from "../../../../apps/example-next/lib/payload.js";
import { buildInitialPayload } from "../../../../apps/example-next/lib/server-contract.js";
// Deliberate failures; excluded from the positive program. Not authorization.
const initial = buildInitialPayload("primary");
const invalid: InitialPayload = { ...initial, query: () => initial.query };
const callbacks: InitialPayload = { ...initial, onSubmit: () => {} };
export { invalid, callbacks };
