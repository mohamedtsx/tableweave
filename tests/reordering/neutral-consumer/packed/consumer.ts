// Authoring only. Main must select a real public neutral API before a packed
// consumer can import the source-private binding/renderer contracts legitimately.
import type {
  ReorderAdmission,
  ReorderAdmissionLease,
} from "@tableweave/react/reordering-controller";
import type { QuerySchema } from "@tableweave/react/contracts";
export type ApplicationLease<
  S extends QuerySchema,
  T extends object,
> = readonly [ReorderAdmission<S, T>, ReorderAdmissionLease<S, T>];
