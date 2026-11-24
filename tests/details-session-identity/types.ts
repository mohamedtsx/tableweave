import type { TableController } from "@tableweave/react";
import {
  type DetailsSessionOwner,
  getDetailsSessionOwner,
} from "../../packages/heroui/src/details/session-identity.js";
import type { DetailsSession } from "../../packages/heroui/src/details/types.js";
import type { Item, Schema } from "./fixtures.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;
type WritableKeys<T> = {
  [K in keyof T]-?: Equal<
    { [P in K]: T[P] },
    { -readonly [P in K]: T[P] }
  > extends true
    ? K
    : never;
}[keyof T];

export function inference(session: DetailsSession<Schema, Item>) {
  const owner = getDetailsSessionOwner(session);
  type DeducedOwner = Assert<
    Equal<typeof owner, DetailsSessionOwner<Schema> | null>
  >;
  const inferred: DeducedOwner = true;
  void inferred;
  const exact: DetailsSessionOwner<Schema> | null = owner;
  return exact;
}
export type ExactOwner = Assert<
  Equal<ReturnType<typeof inference>, DetailsSessionOwner<Schema> | null>
>;
export type ExactController = Assert<
  Equal<DetailsSessionOwner<Schema>["controller"], TableController<Schema>>
>;
export type LegacyOnly = Assert<
  Equal<DetailsSessionOwner<Schema>["mode"], "legacy">
>;
export type ReadonlyOwner = Assert<
  Equal<WritableKeys<DetailsSessionOwner<Schema>>, never>
>;
