import { BASE, type Plan } from "./fixture.js";
export const MODES = ["client", "server-known", "server-unknown"] as const;
export type Mode = (typeof MODES)[number];
export const KINDS = [
  "initial",
  "all",
  "any",
  "join",
  "sort",
  "page",
  "visibility",
] as const;
export type Kind = (typeof KINDS)[number] | "typing";
export interface Scenario {
  readonly id: string;
  readonly mode: Mode;
  readonly kind: Kind;
}
export const SCENARIOS: readonly Scenario[] = MODES.flatMap((mode) =>
  KINDS.map((kind) => Object.freeze({ id: `${mode}:${kind}`, mode, kind })),
);
export const AUXILIARY: readonly Scenario[] = MODES.map((mode) => ({
  id: `${mode}:typing`,
  mode,
  kind: "typing",
}));
export const DISTRIBUTION = [34, 33, 33] as const;
export function plans(
  kind: Kind,
  direction: 0 | 1,
): { readonly before: Plan; readonly after: Plan } {
  let a: Plan = BASE,
    b: Plan = BASE;
  if (kind === "all" || kind === "any") {
    a = { ...BASE, rules: true, join: kind === "all" ? "and" : "or" };
    b = { ...a, variant: 1 };
  }
  if (kind === "join") {
    a = { ...BASE, rules: true };
    b = { ...a, join: "or" };
  }
  if (kind === "sort") {
    a = { ...BASE, sort: "asc" };
    b = { ...BASE, sort: "desc" };
  }
  if (kind === "page") b = { ...BASE, page: 1 };
  if (kind === "visibility") b = { ...BASE, hidden: true };
  if (kind === "typing") {
    a = { ...BASE, search: "wp14-000" };
    b = { ...BASE, search: "wp14-001" };
  }
  return direction === 0 ? { before: a, after: b } : { before: b, after: a };
}
