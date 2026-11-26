import type { TableController } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { lookupDetailsBinding } from "../data-table/details-binding.js";
import type { DetailsSession } from "./types.js";

/** Producer identity only, never native-controller validity or a readiness grant. */
export interface DetailsSessionOwner<S extends QuerySchema> {
  readonly controller: TableController<S>;
  readonly mount: object;
  readonly mode: "legacy";
}

const owners = new WeakMap<object, unknown>();

export interface AdoptedDetailsSessionOwner<S extends QuerySchema> {
  readonly controller: TableController<S>;
  readonly mount: object;
  readonly mode: "adopted";
  readonly binding: object;
  readonly actor: object | null;
}

/** Only a registry-issued bound producer can record adopted provenance. */
export function recordAdoptedDetailsSession<
  S extends QuerySchema,
  T extends object,
>(session: DetailsSession<S, T>, input: unknown): void {
  const binding = lookupDetailsBinding<S, T>(input);
  if (!binding) throw new Error("Unknown details binding.");
  owners.set(
    session,
    Object.freeze({
      controller: binding.controller,
      mount: binding.mount,
      mode: "adopted",
      binding,
      actor: binding.cell.getSnapshot().actor,
    }),
  );
}
export function getAdoptedDetailsSessionOwner<
  S extends QuerySchema,
  T extends object,
>(session: DetailsSession<S, T>): AdoptedDetailsSessionOwner<S> | null {
  if (!session || typeof session !== "object") return null;
  const owner = owners.get(session) as
    | AdoptedDetailsSessionOwner<S>
    | undefined;
  return owner?.mode === "adopted" ? owner : null;
}

/** Source-private producer bookkeeping. Not a package export or consumer API.
 * Direct internal-module imports are not a consumer security boundary.
 * This raw producer always issues legacy mode, never an application-selected mode.
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
  const owner = owners.get(session) as
    | DetailsSessionOwner<S>
    | AdoptedDetailsSessionOwner<S>
    | undefined;
  return owner?.mode === "legacy" ? owner : null;
}
