// Clean installed-package lane only; no source aliases or speculative constructors.
import { revokeReorderInteraction } from "@tableweave/react/reordering-controller";
import type { ReorderInteraction } from "@tableweave/react/reordering-controller";
import type { QuerySchema } from "@tableweave/react/contracts";
export const release: (input: unknown) => undefined = revokeReorderInteraction;
export function retireKnown(
  value: ReorderInteraction<QuerySchema, object>,
): undefined {
  return release(value);
}
