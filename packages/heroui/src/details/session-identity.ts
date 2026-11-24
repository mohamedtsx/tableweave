import type { TableController } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { DetailsSession } from "./types.js";

/** Producer identity only, never native-controller validity or a readiness grant. */
export interface DetailsSessionOwner<S extends QuerySchema> {
  readonly controller: TableController<S>;
  readonly mount: object;
  readonly mode: "legacy";
}

const owners = new WeakMap<object, unknown>();

/** Source-private producer bookkeeping. Not a package export or consumer API.
 * Direct internal-module imports are not a consumer security boundary.
 * No adopted mode or authority can be issued by this module.
 */
export function recordDetailsSession<S extends QuerySchema, T extends object>(
  session: DetailsSession<S, T>,
  controller: TableController<NoInfer<S>>,
  mount: object,
): void {
  owners.set(session, Object.freeze({ controller, mount, mode: "legacy" }));
}

/** Exact identity lookup before any alleged field, getter, method or prototype.
 * An issued view remains historical issuance after replacement or unmount.
 * A raw controller recorded here has not been authenticated as a native factory C.
 */
export function getDetailsSessionOwner<S extends QuerySchema, T extends object>(
  session: DetailsSession<S, T>,
): DetailsSessionOwner<S> | null {
  if (session === null || typeof session !== "object") return null;
  return (owners.get(session) as DetailsSessionOwner<S> | undefined) ?? null;
}
