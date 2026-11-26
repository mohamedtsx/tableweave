import type { PageInfo, ResourceSuccess } from "@tableweave/react";
import type { DemoQuery } from "./schema";

export type Actor = "alpha" | "beta";
export interface RecordRow {
  readonly id: string;
  readonly label: string;
  readonly amount: number;
  readonly status: "active" | "paused";
}
export interface Bootstrap {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly clock: number;
  readonly query: DemoQuery;
  readonly tableId: string;
}
export interface AuthorizationIdentity {
  readonly id: number;
  readonly definitionKey: string;
  readonly scopeKey: string;
}
export interface AuthorizedBootstrap extends Bootstrap {
  readonly authorizationId: number;
}
export type BootstrapOutcome =
  | { readonly kind: "authorized"; readonly bootstrap: Bootstrap }
  | { readonly kind: "access-lost"; readonly code: "access-lost" };
export interface Canary {
  readonly scopeKey: string;
  readonly value: string;
}
export type CanaryOutcome =
  | { readonly kind: "authorized"; readonly canary: Canary }
  | { readonly kind: "access-lost"; readonly code: "access-lost" };
export type RowsOutcome =
  | { readonly kind: "ready"; readonly result: RowsResult }
  | { readonly kind: "access-lost"; readonly code: "access-lost" };
export const modes = [
  "normal",
  "fail",
  "empty",
  "slow",
  "uncancellable",
  "unknown",
  "unknown-last",
  "shrink",
  "deny",
] as const;
export type ReadMode = (typeof modes)[number];
export interface ReadInput {
  readonly scopeKey: string;
  readonly clock: number;
  readonly query: DemoQuery;
  readonly requestKey: string;
  readonly mode: ReadMode;
}
export interface RowsResult extends ResourceSuccess<RecordRow> {
  readonly source: "fresh";
  readonly scopeKey: string;
  readonly queryKey: string;
  readonly requestKey: string;
  readonly page: PageInfo;
  readonly correctedPage: number | null;
}
export interface ReadStats {
  readonly reads: number;
  readonly aborted: number;
  readonly completed: number;
}
