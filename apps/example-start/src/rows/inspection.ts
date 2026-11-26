export interface RuntimeInspection {
  readonly scopeKey: string;
  readonly definitionKey: string;
  readonly authorizationId: number;
  readonly controllerDisposed: boolean;
  readonly access: boolean;
  readonly canSelect: boolean;
  readonly active: boolean;
  readonly rows: number;
  readonly selectionCount: number;
  readonly detailsOpen: boolean;
  readonly serverRows: number;
  readonly serverAccess: boolean;
  readonly cachedScopes: readonly string[];
  readonly canary: unknown;
}
declare global {
  interface Window {
    /** Read-only synthetic acceptance probe; no records, queries, or credentials. */
    __wp06Inspect?: () => RuntimeInspection;
    /** Captured after unmount only by the synthetic reconnect regression. */
    __wp06Reconnect?: () => () => void;
    /** Same existing router action as the Reload authorization button. */
    __wp06Revalidate?: () => Promise<void>;
  }
}
