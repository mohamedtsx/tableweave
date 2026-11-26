import type {
  ControlsAuthority,
  ControlsPresentation,
  NativeDefinition,
  ResourceContext,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { ReactElement } from "react";
import type { TableReorderingNavigation } from "../table/reordering-types.js";

export type PaginationNumberFormatter = (
  value: number,
  locale: string,
) => string;

/** A complete replacement dictionary; functions receive already formatted numbers. */
export interface PaginationMessages {
  readonly navigation: string;
  readonly rowsPerPage: string;
  readonly previous: string;
  readonly next: string;
  readonly retry: string;
  readonly noPages: string;
  readonly unavailable: string;
  readonly unknownRange: string;
  readonly updating: string;
  readonly retained: string;
  readonly stale: string;
  readonly navigationUnavailable: string;
  readonly firstPage: string;
  readonly lastPage: string;
  readonly page: (page: string) => string;
  readonly knownPage: (page: string, count: string) => string;
  readonly outOfRange: (page: string, count: string) => string;
  readonly knownRange: (from: string, to: string, total: string) => string;
  readonly unknownTotalRange: (from: string, to: string) => string;
  readonly unknownRangeKnownTotal: (total: string) => string;
}

export interface PaginationProps<S extends QuerySchema, T extends object> {
  readonly reorderInterlock?: TableReorderingNavigation<S, T>;
  readonly schema: S;
  /** Render facts from projectControls for this render, not authority.read(). */
  readonly presentation: ControlsPresentation<S, T>;
  readonly authority: ControlsAuthority<S, T>;
  readonly locale?: string;
  readonly messages?: PaginationMessages;
  readonly formatNumber?: PaginationNumberFormatter;
  readonly id?: string;
  readonly className?: string;
  /** Real app-owned retry/transport wrapper. The pager never starts a request. */
  readonly onRetry?: (current: ControlsPresentation<S, T>) => void;
}

export type PaginationComponent = <S extends QuerySchema, T extends object>(
  props: PaginationProps<S, T>,
) => ReactElement | null;

export interface PaginationCorrectionEpoch {
  readonly context: ResourceContext;
  /** App-owned causality tag, advanced BEFORE every external navigation/query/
   * scope reset (including A→B→A). Do not advance for this hook's clamp or its
   * controlled acceptance/request/response. No library query mirror is needed. */
  readonly epoch: string | number;
}

export interface PaginationCorrectionContext<
  S extends QuerySchema,
  T extends object,
> extends PaginationCorrectionEpoch {
  readonly definition: NativeDefinition<S, T>;
  /** Pure synchronous event-time port returning own-data context/epoch envelopes.
   * Own data methods keep their original receiver. Accessor/throwing/malformed
   * envelopes and Promise/thenable output cannot authorize correction. Defensive
   * rejection observation is best effort only for ordinary unmodified native
   * Promises in the captured realm; altered/subclassed/cross-realm/proxied values
   * may remain app-owned and host-unhandled. No mutation or global suppression.
   * No speculative render context; snapshots do not encode action origin. */
  readonly readCurrent: () => PaginationCorrectionEpoch;
}
