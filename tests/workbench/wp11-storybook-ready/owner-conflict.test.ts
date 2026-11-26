import { ContractError, defineQuerySchema } from "@tableweave/react/contracts";
import { describe, expect, test } from "vitest";
import { ownerConflictDiagnostic } from "../../../apps/examples/shared/schemas.js";

function definition(owner: "tabs" | "builder") {
  return {
    id: "example-invalid-owner",
    version: 1,
    fields: { amount: { type: "number", owner } },
    tabs: [
      {
        id: "conflict",
        rules: [{ field: "amount", operator: "number.eq", value: 0 }],
      },
    ],
  } as const;
}

describe("isolated example owner-conflict diagnostic", () => {
  test("otherwise identical tabs-owned amount is a valid positive control", () => {
    const schema = defineQuerySchema(definition("tabs"));
    expect(schema.fields.amount.owner).toBe("tabs");
    expect(schema.tabs[0]?.rules).toEqual([
      { field: "amount", operator: "number.eq", value: 0 },
    ]);
  });

  test("builder ownership rejects with the actual public fieldless schema error", () => {
    let failure: unknown;
    try {
      defineQuerySchema(definition("builder"));
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(ContractError);
    if (!(failure instanceof ContractError))
      throw new Error("Expected genuine schema rejection");
    expect(failure.issues).toEqual([{ code: "schema.invalid" }]);
    expect(Object.hasOwn(failure.issues[0] ?? {}, "field")).toBe(false);
  });

  test("paired genuine constructions retain the exact owner-specific UI diagnostic", () => {
    expect(ownerConflictDiagnostic()).toBe(
      "Configuration rejected: a tabs predicate cannot claim a builder-owned field.",
    );
  });
});
