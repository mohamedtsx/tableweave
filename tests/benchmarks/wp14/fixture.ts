/** Authored deterministic INPUT and independent oracle. Never executed by LIGHT. */
export const SEED = 0x57503134;
export const GENERATOR = "xorshift32-row-v1";
export const CLOCK = Date.parse("2026-11-25T12:00:00Z");
export const CLIENT_COUNT = 10_000,
  REMOTE_COUNT = 1_000_000,
  PAGE_SIZE = 100;
export interface BenchClient {
  readonly id: string;
  readonly recordLabel: string;
  readonly status: "posted" | "draft";
  readonly amount: number;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly balance: number | null;
  readonly score: number;
  readonly occurredAt: string;
  readonly bookingDay: string;
  readonly updatedAt: string;
  readonly category: "equipment" | "supplies";
  readonly region: "north" | "south";
  readonly currency: "USD" | "EUR";
  readonly reference: string | null;
  readonly note: string | null;
  readonly accountCode: string;
  readonly active: boolean;
  readonly cleared: boolean | null;
  readonly tags: readonly string[];
  readonly locations: readonly string[];
}
export interface BenchServer extends BenchClient {
  readonly tax: number;
  readonly discount: number;
  readonly weight: number | null;
  readonly leadDays: number;
  readonly expiresOn: string | null;
  readonly createdAt: string;
  readonly supplier: string;
  readonly warehouse: "a" | "b";
  readonly priority: "normal" | "urgent";
  readonly batchRef: string | null;
}
export const CLIENT_KEYS = [
  "recordLabel",
  "status",
  "amount",
  "quantity",
  "unitPrice",
  "balance",
  "score",
  "occurredAt",
  "bookingDay",
  "updatedAt",
  "category",
  "region",
  "currency",
  "reference",
  "note",
  "accountCode",
  "active",
  "cleared",
  "tags",
  "locations",
] as const satisfies readonly (keyof BenchClient)[];
export const SERVER_KEYS = [
  ...CLIENT_KEYS,
  "tax",
  "discount",
  "weight",
  "leadDays",
  "expiresOn",
  "createdAt",
  "supplier",
  "warehouse",
  "priority",
  "batchRef",
] as const satisfies readonly (keyof BenchServer)[];
export function row(ordinal: number): BenchServer {
  if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= REMOTE_COUNT)
    throw new Error("E_ORDINAL");
  let state = (SEED ^ ordinal) >>> 0;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  const id = `wp14-${String(ordinal).padStart(6, "0")}`;
  const amount = random() % 10_000,
    quantity = random() % 100,
    unitPrice = random() % 1000;
  const score = random() % 100,
    bookingDay = `2026-11-${String(1 + (random() % 25)).padStart(2, "0")}`;
  const occurredAt = `${bookingDay}T09:00:00Z`,
    updatedAt = `${bookingDay}T11:00:00Z`;
  return Object.freeze({
    id,
    recordLabel: id,
    status: random() % 3 ? "posted" : "draft",
    amount,
    quantity,
    unitPrice,
    balance: random() % 5 ? amount - 5000 : null,
    score,
    occurredAt,
    bookingDay,
    updatedAt,
    category: random() % 2 ? "equipment" : "supplies",
    region: random() % 2 ? "north" : "south",
    currency: random() % 2 ? "USD" : "EUR",
    reference: random() % 4 ? `REF-${ordinal}` : null,
    note: random() % 5 ? "public local synthetic" : null,
    accountCode: `AC-${random() % 12}`,
    active: random() % 2 === 0,
    cleared: random() % 4 ? random() % 2 === 0 : null,
    tags: Object.freeze(random() % 2 ? ["local", "review"] : []),
    locations: Object.freeze(random() % 2 ? ["a"] : ["b"]),
    tax: random() % 100,
    discount: random() % 20,
    weight: random() % 5 ? random() % 1000 : null,
    leadDays: random() % 30,
    expiresOn: random() % 3 ? "2027-11-25" : null,
    createdAt: "2026-01-01T00:00:00Z",
    supplier: `Supplier ${random() % 40}`,
    warehouse: random() % 2 ? "a" : "b",
    priority: random() % 5 ? "normal" : "urgent",
    batchRef: random() % 3 ? `B-${ordinal % 50}` : null,
  });
}
export function clientRows(): readonly BenchClient[] {
  // Separate actual 20-semantic-field records, not server records with hidden extras.
  return Object.freeze(
    Array.from({ length: CLIENT_COUNT }, (_, index) => {
      const source = row(index);
      return Object.freeze({
        id: source.id,
        recordLabel: source.recordLabel,
        status: source.status,
        amount: source.amount,
        quantity: source.quantity,
        unitPrice: source.unitPrice,
        balance: source.balance,
        score: source.score,
        occurredAt: source.occurredAt,
        bookingDay: source.bookingDay,
        updatedAt: source.updatedAt,
        category: source.category,
        region: source.region,
        currency: source.currency,
        reference: source.reference,
        note: source.note,
        accountCode: source.accountCode,
        active: source.active,
        cleared: source.cleared,
        tags: source.tags,
        locations: source.locations,
      });
    }),
  );
}
export function cellText(value: unknown): string {
  if (value === null) return "∅";
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  )
    return String(value);
  if (Array.isArray(value) && value.every((item) => typeof item === "string"))
    return value.join("|");
  throw new Error("E_CELL_VALUE");
}
export function digest(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
export interface Plan {
  readonly rules: boolean;
  readonly join: "and" | "or";
  readonly variant: 0 | 1;
  readonly sort: "none" | "asc" | "desc";
  readonly page: 0 | 1;
  readonly hidden: boolean;
  readonly search: string;
}
export const BASE: Plan = Object.freeze({
  rules: false,
  join: "and",
  variant: 0,
  sort: "none",
  page: 0,
  hidden: false,
  search: "",
});
/** Independent simple specification, not the production predicate/row model. */
function matches(value: BenchClient, plan: Plan): boolean {
  if (plan.search && !value.recordLabel.includes(plan.search)) return false;
  if (!plan.rules) return true;
  const rules = [
    value.amount >= (plan.variant ? 2000 : 1000),
    value.quantity < 90,
    value.category === "equipment",
    value.note?.includes("local") === true,
    value.bookingDay >= "2026-11-05",
  ];
  return plan.join === "and" ? rules.every(Boolean) : rules.some(Boolean);
}
export function oracleOrdinals(
  plan: Plan,
  count: number,
): { readonly total: number; readonly ordinals: readonly number[] } {
  let total = 0;
  const best: { ordinal: number; amount: number; id: string }[] = [];
  const limit = (plan.page + 1) * PAGE_SIZE;
  const compare = (a: (typeof best)[number], b: (typeof best)[number]) => {
    if (plan.sort !== "none") {
      const amount = a.amount - b.amount;
      if (amount) return plan.sort === "asc" ? amount : -amount;
    }
    return a.ordinal - b.ordinal;
  };
  for (let ordinal = 0; ordinal < count; ordinal++) {
    const value = row(ordinal);
    if (!matches(value, plan)) continue;
    total++;
    if (best.length === limit && plan.sort === "none") continue;
    const candidate = { ordinal, amount: value.amount, id: value.id };
    let low = 0,
      high = best.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      const at = best[middle];
      if (!at) throw new Error("E_ORACLE_INDEX");
      if (compare(at, candidate) <= 0) low = middle + 1;
      else high = middle;
    }
    if (low < limit) {
      best.splice(low, 0, candidate);
      if (best.length > limit) best.pop();
    }
  }
  const ordinals = best
    .slice(plan.page * PAGE_SIZE)
    .map((value) => value.ordinal);
  if (ordinals.length !== PAGE_SIZE) throw new Error("E_ORACLE_NOT_100");
  return Object.freeze({ total, ordinals: Object.freeze(ordinals) });
}
export interface Oracle {
  readonly ids: readonly string[];
  readonly headers: readonly string[];
  readonly cells: string;
  readonly total: number;
  readonly hasNextPage: boolean;
  readonly page: number;
  readonly inputCount: number;
  readonly digest: string;
}
export function oracle(plan: Plan, server: boolean): Oracle {
  const found = oracleOrdinals(plan, server ? REMOTE_COUNT : CLIENT_COUNT),
    keys = server ? SERVER_KEYS : CLIENT_KEYS;
  const headers = keys.filter((key) => !plan.hidden || key !== "reference");
  const rows = found.ordinals.map(row),
    cells = JSON.stringify(
      rows.map((value) => headers.map((key) => cellText(value[key]))),
    );
  const ids = rows.map((value) => value.id);
  return Object.freeze({
    ids,
    headers,
    cells: digest(cells),
    total: found.total,
    hasNextPage: (plan.page + 1) * PAGE_SIZE < found.total,
    page: plan.page,
    inputCount: server ? PAGE_SIZE : CLIENT_COUNT,
    digest: digest(
      JSON.stringify({ plan, ids, headers, cells, total: found.total }),
    ),
  });
}
