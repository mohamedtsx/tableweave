import {
  type CriteriaAuthority,
  type CriteriaCurrent,
  type CriteriaOrigin,
  type CriteriaPublication,
  type CriteriaPublicationRetirementPort,
  type CriteriaPublicationTicket,
  createCriteriaAuthority,
  createCriteriaPublication,
  requireCriteriaAuthority,
} from "@tableweave/react/criteria";
import type { QuerySchema } from "../../packages/react/src/contracts/types.js";
import type {
  ControllerDefinition,
  TableController,
} from "../../packages/react/src/controller/types.js";

type A = QuerySchema<{
  readonly id: "entry-a";
  readonly version: 1;
  readonly fields: {
    readonly title: { readonly type: "text"; readonly owner: "builder" };
  };
}>;
type B = QuerySchema<{
  readonly id: "entry-b";
  readonly version: 1;
  readonly fields: {
    readonly amount: { readonly type: "number"; readonly owner: "builder" };
  };
}>;
export function negatives(
  c: TableController<A>,
  wrongDefinition: ControllerDefinition<B>,
  retirement: CriteriaPublicationRetirementPort<A>,
  authority: CriteriaAuthority<A>,
  origin: CriteriaOrigin<A>,
  wrongOrigin: CriteriaOrigin<B>,
  wrongCurrent: () => CriteriaCurrent<B>,
  p: CriteriaPublication<A>,
  wrongTicket: CriteriaPublicationTicket<B>,
) {
  // @ts-expect-error CE-N1 NoInfer rejects a foreign authority target schema
  requireCriteriaAuthority(authority, wrongOrigin);
  // @ts-expect-error CE-N2 receipt schema remains associated with the publication
  p.complete(wrongTicket);
  // @ts-expect-error CE-N3 lifecycle metadata readonly
  origin.epoch = 2;
  createCriteriaAuthority<A>({
    origin,
    // @ts-expect-error CE-N4 reader cannot widen authority schema
    readCurrent: wrongCurrent,
  });
  createCriteriaPublication<A>({
    controller: c,
    retirement,
    // @ts-expect-error CE-N5 definition cannot widen controller schema
    definition: wrongDefinition,
  });
  // @ts-expect-error CE-N6 ticket provenance brand cannot be structurally fabricated
  const ticket: CriteriaPublicationTicket<A> = {};
  return ticket;
}
