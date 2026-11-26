import { ContractError, defineQuerySchema } from "@tableweave/react/contracts";
import {
  createOperatorRegistry,
  defineOperator,
} from "@tableweave/react/filters";

export const exampleOperators = createOperatorRegistry([
  defineOperator({
    id: "example.multiple-of",
    labelKey: "Multiple of",
    types: ["number"],
    cardinality: "one",
    validate(value): value is number {
      return typeof value === "number" && Number.isFinite(value) && value > 0;
    },
    evaluate(record, value) {
      return (
        typeof record === "number" &&
        typeof value === "number" &&
        record % value === 0
      );
    },
  }),
] as const);
export const minimalTransactionSchema = defineQuerySchema({
  id: "example-minimal-transactions",
  version: 1,
  fields: {
    description: { type: "text", owner: "builder" },
    amount: { type: "number", owner: "builder" },
  },
});
export const transactionSchema = defineQuerySchema(
  {
    id: "example-transactions",
    version: 1,
    fields: {
      description: { type: "text", owner: "search", sort: true },
      status: { type: "enum", owner: "tabs", values: ["posted", "draft"] },
      occurred: { type: "datetime", owner: "date" },
      amount: {
        type: "number",
        owner: "builder",
        sort: true,
        operators: [
          "number.eq",
          "number.gt",
          "number.between",
          "example.multiple-of",
        ],
      },
      reference: { type: "text", owner: "builder", nullable: true },
      account: {
        type: "enum",
        owner: "builder",
        idType: "number",
        values: [0, 1, 2],
      },
      tags: { type: "set", owner: "builder", values: ["review", "local"] },
      cleared: { type: "boolean", owner: "builder", nullable: true },
      bookingDay: { type: "date", owner: "builder" },
    },
    tabs: [
      {
        id: "posted",
        rules: [{ field: "status", operator: "enum.is", value: "posted" }],
      },
      {
        id: "draft",
        rules: [{ field: "status", operator: "enum.is", value: "draft" }],
      },
    ],
    date: { mode: "range" },
    search: { debounceMs: 180 },
    sorting: { multi: true },
  },
  exampleOperators,
);
export const customerSchema = defineQuerySchema({
  id: "example-customers",
  version: 1,
  fields: {
    name: { type: "text", owner: "search", sort: true },
    segment: { type: "enum", owner: "tabs", values: ["current", "paused"] },
    joined: { type: "datetime", owner: "date" },
    balance: { type: "number", owner: "builder", sort: true },
    note: { type: "text", owner: "builder", nullable: true },
    active: { type: "boolean", owner: "builder" },
    teams: { type: "set", owner: "builder", values: ["north", "south"] },
  },
  tabs: [
    {
      id: "current",
      rules: [{ field: "segment", operator: "enum.is", value: "current" }],
    },
    {
      id: "paused",
      rules: [{ field: "segment", operator: "enum.is", value: "paused" }],
    },
  ],
  date: { mode: "range" },
  sorting: { multi: true },
});
export const inventorySchema = defineQuerySchema({
  id: "example-inventory",
  version: 1,
  fields: {
    title: { type: "text", owner: "search", sort: true },
    status: { type: "enum", owner: "tabs", values: ["available", "archived"] },
    updated: { type: "datetime", owner: "date" },
    quantity: { type: "number", owner: "builder", sort: true },
    category: {
      type: "enum",
      owner: "builder",
      values: ["equipment", "supplies"],
    },
    locations: { type: "set", owner: "builder", values: ["0", "shelf-b"] },
    reserved: { type: "boolean", owner: "builder" },
    note: { type: "text", owner: "builder", nullable: true },
  },
  tabs: [
    {
      id: "available",
      rules: [{ field: "status", operator: "enum.is", value: "available" }],
    },
    {
      id: "archived",
      rules: [{ field: "status", operator: "enum.is", value: "archived" }],
    },
  ],
  date: { mode: "range" },
  sorting: { multi: true },
});
export type TransactionSchema = typeof transactionSchema;
export type CustomerSchema = typeof customerSchema;
export type InventorySchema = typeof inventorySchema;

/** A real definition error rendered as a diagnostic, never a fallback grant. */
export function ownerConflictDiagnostic(): string {
  const definition = {
    id: "example-invalid-owner",
    version: 1,
    fields: { amount: { type: "number", owner: "builder" } },
    tabs: [
      {
        id: "conflict",
        rules: [{ field: "amount", operator: "number.eq", value: 0 }],
      },
    ],
  } as const;
  const unclassified =
    "Configuration failed for another reason; owner-conflict classification needs review.";
  try {
    defineQuerySchema({
      ...definition,
      fields: { amount: { ...definition.fields.amount, owner: "tabs" } },
    });
  } catch {
    return unclassified;
  }
  try {
    defineQuerySchema(definition);
    return "Unexpected acceptance: owner-conflict fixture needs review.";
  } catch (error) {
    // The isolated owner change proves this known amount fixture's cause;
    // the public schema.invalid issue intentionally carries no field identity.
    return error instanceof ContractError &&
      error.issues.length === 1 &&
      error.issues[0]?.code === "schema.invalid"
      ? "Configuration rejected: a tabs predicate cannot claim a builder-owned field."
      : unclassified;
  }
}
