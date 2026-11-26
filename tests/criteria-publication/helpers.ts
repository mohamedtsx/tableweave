import { expect } from "vitest";
import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import type { CriteriaOrigin } from "../../packages/react/src/controller/criteria.js";
import type {
  CriteriaPublication,
  CriteriaPublicationBeginResult,
  CriteriaPublicationEvent,
  CriteriaPublicationNext,
  CriteriaPublicationRetirementPort,
} from "../../packages/react/src/controller/criteria-publication.js";
import {
  CriteriaPublicationError,
  createCriteriaPublication,
} from "../../packages/react/src/controller/criteria-publication.js";
import { createTableController } from "../../packages/react/src/controller/store.js";
import type { ControllerOptions } from "../../packages/react/src/controller/types.js";

export const schema = defineQuerySchema({
  id: "publication",
  version: 1,
  fields: {
    name: { type: "text", owner: "search", sort: true },
    amount: { type: "number", owner: "builder", sort: true },
  },
});
export type S = typeof schema;
export function controller(options: Partial<ControllerOptions<S>> = {}) {
  return createTableController(
    { schema, selection: true, columns: [{ id: "name" }, { id: "amount" }] },
    {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
      ...options,
    },
  );
}
export function fixture(
  owner = controller(),
  callback: (event: CriteriaPublicationEvent<S>) => unknown = () => undefined,
) {
  const definition = owner.getDefinition();
  let calls = 0;
  const retirement: CriteriaPublicationRetirementPort<S> = {
    retire(event) {
      expect(this).toBe(retirement);
      calls++;
      return callback(event) as undefined;
    },
  };
  const publication = createCriteriaPublication({
    controller: owner,
    definition,
    retirement,
  });
  const next = (scopeKey = "a", access = true): CriteriaPublicationNext<S> => ({
    controller: owner,
    definition,
    expected: { definitionKey: "d", scopeKey, access },
    actual: { definitionKey: "d", scopeKey, access },
  });
  return {
    owner,
    definition,
    publication,
    next,
    calls: () => calls,
    retirement,
  };
}
export function pending(result: CriteriaPublicationBeginResult<S>) {
  expect(result.status).toBe("pending");
  if (result.status !== "pending") throw new Error("Expected pending fixture");
  return result.ticket;
}
export function origin(publication: CriteriaPublication<S>): CriteriaOrigin<S> {
  const frame = publication.getSnapshot();
  const current = frame.current ?? frame.pending;
  if (!current) throw new Error("Expected captured domain fixture");
  return {
    controller: current.controller,
    definition: current.definition,
    context: current.expected,
    epoch: current.epoch,
  };
}
export function settle(f: ReturnType<typeof fixture>, scope = "a") {
  const ticket = pending(f.publication.begin(f.next(scope)));
  const authority = f.publication.issue(origin(f.publication));
  expect(f.publication.complete(ticket).status).toBe("settled");
  return { ticket, authority, origin: origin(f.publication) };
}
export function unsafe<T>(value: unknown): T {
  return value as T;
}
export function invalid(action: () => unknown) {
  let threw = false;
  try {
    action();
  } catch (error) {
    threw = true;
    expect(error).toBeInstanceOf(CriteriaPublicationError);
    expect(error).toMatchObject({
      code: "criteria.publication.invalid",
      message: "Invalid criteria publication operation.",
    });
    expect(Object.hasOwn(error as object, "cause")).toBe(false);
  }
  expect(threw).toBe(true);
}
export function poison() {
  let calls = 0;
  const touch = () => {
    calls++;
    throw new Error("Unexpected private traversal");
  };
  return {
    value: new Proxy(
      {},
      { get: touch, getPrototypeOf: touch, getOwnPropertyDescriptor: touch },
    ),
    calls: () => calls,
  };
}
export function trapped<T extends object>(target: T, action: () => void): T {
  let first = true;
  return new Proxy(target, {
    getOwnPropertyDescriptor(object, key) {
      if (first) {
        first = false;
        action();
      }
      return Reflect.getOwnPropertyDescriptor(object, key);
    },
  });
}
