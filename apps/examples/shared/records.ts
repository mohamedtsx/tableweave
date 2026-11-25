/** Public synthetic inputs, not accepted/native output caches or business policy. */
export const fixedNow = Date.parse("2026-11-25T12:00:00Z");
export const receivedAt = "2026-11-25T12:00:00Z";
export interface Transaction {
  readonly id: string;
  readonly description: string;
  readonly status: "posted" | "draft";
  readonly occurred: string;
  readonly amount: number;
  readonly reference: string | null;
  readonly account: number;
  readonly tags: readonly string[];
  readonly cleared: boolean | null;
  readonly bookingDay: string;
}
export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly segment: "current" | "paused";
  readonly joined: string;
  readonly balance: number;
  readonly note: string | null;
  readonly active: boolean;
  readonly teams: readonly string[];
}
export interface InventoryItem {
  readonly id: string;
  readonly title: string;
  readonly status: "available" | "archived";
  readonly updated: string;
  readonly quantity: number;
  readonly category: "equipment" | "supplies";
  readonly locations: readonly string[];
  readonly reserved: boolean;
  readonly note: string | null;
}
export const transactions: readonly Transaction[] = Object.freeze(
  Array.from({ length: 24 }, (_, index) =>
    Object.freeze({
      id: `tx-${String(index + 1).padStart(3, "0")}`,
      description: `Transfer note ${String(index + 1).padStart(2, "0")}`,
      status: index % 3 === 0 ? ("draft" as const) : ("posted" as const),
      occurred: `2026-11-${index % 2 ? "24" : "25"}T09:00:00Z`,
      amount: index === 0 ? 0 : (index % 2 ? 1 : -1) * index * 12.5,
      reference: index === 0 ? null : index === 1 ? "" : `REF-${index + 1}`,
      account: index % 3,
      tags: index % 2 ? ["review", "local"] : [],
      cleared: index === 0 ? null : index % 2 === 0,
      bookingDay: "2026-11-25",
    }),
  ),
);
export const customers: readonly Customer[] = Object.freeze(
  Array.from({ length: 14 }, (_, index) =>
    Object.freeze({
      id: `cu-${String(index + 1).padStart(3, "0")}`,
      name: `Customer ${String(index + 1).padStart(2, "0")}`,
      segment: index % 3 === 0 ? ("paused" as const) : ("current" as const),
      joined: "2026-11-24T09:00:00Z",
      balance: index * 25,
      note: index === 0 ? null : `Synthetic account note ${index + 1}`,
      active: index % 3 !== 0,
      teams: index % 2 ? ["north"] : ["south", "north"],
    }),
  ),
);
export const inventory: readonly InventoryItem[] = Object.freeze(
  [
    "Desk stand",
    "Cable tray",
    "Task light",
    "Document tray",
    "Desk mat",
    "Laptop riser",
    "Storage box",
    "Notebook",
    "Clip set",
    "Marker set",
    "Folder",
    "Pen holder",
  ].map((title, index) =>
    Object.freeze({
      id: `it-${String(index + 1).padStart(3, "0")}`,
      title,
      status: index === 4 ? ("archived" as const) : ("available" as const),
      updated: "2026-11-25T09:00:00Z",
      quantity: index * 3,
      category: index < 6 ? ("equipment" as const) : ("supplies" as const),
      locations: index % 2 ? ["0", "shelf-b"] : [],
      reserved: index % 3 === 0,
      note: index === 0 ? null : "Synthetic stock note",
    }),
  ),
);
