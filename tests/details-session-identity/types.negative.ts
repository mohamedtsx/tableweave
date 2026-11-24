import type { TableController } from "@tableweave/react";
import { getDetailsSessionOwner } from "../../packages/heroui/src/details/session-identity.js";
import type { DetailsSession } from "../../packages/heroui/src/details/types.js";
import type { Item, Schema } from "./fixtures.js";

declare const session: DetailsSession<Schema, Item>;
declare const replacement: TableController<Schema>;
const owner = getDetailsSessionOwner(session);
if (owner) {
  // @ts-expect-error D1-N1: immutable captured controller association
  owner.controller = replacement;
  // @ts-expect-error D1-N2: immutable inert mount association
  owner.mount = {};
  // @ts-expect-error D1-N3: no adopted mode issued by D1
  owner.mode = "adopted";
}
// @ts-expect-error D1-N4: explicit record type cannot substitute an unrelated record
getDetailsSessionOwner<Schema, { other: number }>(session);
