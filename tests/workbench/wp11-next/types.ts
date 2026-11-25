import type { NextConfig } from "next";
import type { DataTableProps } from "@tableweave/heroui";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { InitialPayload } from "../../../apps/example-next/lib/payload.js";

export type Configuration = NextConfig;
export type PublicTable<
  S extends QuerySchema,
  T extends object,
> = DataTableProps<S, T>;
type JsonShape<T> = T extends (...args: never[]) => unknown
  ? never
  : T extends string | number | boolean | null
    ? T
    : T extends readonly (infer Value)[]
      ? readonly JsonShape<Value>[]
      : T extends object
        ? { readonly [Key in keyof T]: JsonShape<T[Key]> }
        : never;
/** Positive shape proof only, not a runtime wire validator or authority. */
export function plainPayload(value: InitialPayload): JsonShape<InitialPayload> {
  return value;
}
